// src/shopify.connector.server.ts
//
// Server handler for the single Shopify data connector. Runs inside the
// app-runtime sandbox and serves THREE streams off the one connector:
//   • `customer` → GraphQL `customers` (src/graphql/customer.ts), contributes into the
//                  system `contact` def.
//   • `order`    → GraphQL `orders` (src/graphql/order.ts), contributes into the
//                  native `order` / `line_item` / `contact` / `part` entities
//                  (money plan 37 §6/§7.2 — the retarget off the old owned
//                  `shopify_orders` / `shopify_line_items` defs).
//   • `product`  → GraphQL `products` (src/graphql/product.ts), contributes into the
//                  native `product` / `part` entities (money plan 37 §7.1).
//
// Every stream returns ONE page of records plus a flat cursor (`fetchGraphqlPage`,
// src/graphql/paged.ts) and the platform re-invokes with `state.cursor` until
// `backfillComplete`. A throttle is surfaced as `rateLimited` (not thrown) so the
// platform pauses + re-enqueues from the same cursor.
//
// Connection contract: resolve from `args.connection` — `value` is the Admin API
// access token, `metadata` carries the shop domain.
//
// The `order` projection also SYNTHESISES a `derived` walk over
// `order.fulfillments[]` (`deriveFulfillments`), rolling it up into ship dates,
// shipped quantities and per-line shipment counts — flattened directly onto the
// order/line fields rather than nested (a contributing mapping's `sourcePath` is
// relative to its `rootPath`, so there is no more separate "declared field key"
// to hide the nesting behind). Nothing in Shopify's payload carries a ship date
// at the order or line level — it exists only inside `fulfillments[]` — and
// accrual revenue is recognised at fulfillment, so this walk is what makes a
// period cut possible. `shipmentCount` is the honesty column: where it is 1 the
// derived dates are exact, and where it is >1 the close job knows to look closer.
//
// The `order` projection also fans out `fulfillments[]` (each with its own
// nested `line_items[]`) into the native `fulfillment` / `fulfillment_line`
// entities (money plan 55, `plans/money/tasks/55-shipment-lines.md` §5). This
// is a SEPARATE walk from `deriveFulfillments` above: that rollup still feeds
// the order/line-level summary fields (kept - other code reads them, and
// retiring them is its own cleanup, 55 §5), while `projectFulfillments` emits
// the full per-dispatch, per-line grain `deriveFulfillments` collapses away.
// Cancelled fulfillments ARE emitted as records here (never filtered, unlike
// `deriveFulfillments`'s rollup) - see `projectFulfillments`'s docblock.
//
// The `order` projection also fans out `refunds[]` (each with its own nested
// `refund_line_items[]`) and `tax_lines[]` (money plan 47/48, accounting plan
// 10) with the same `rootPath` pattern `line_items[]` uses. A Shopify refund
// lands as a CHANNEL-SOURCED CREDIT MEMO (`credit_memo` / `credit_memo_line`,
// accounting plan 10 §1): a credit memo that was created and refunded in the
// same instant. Three things about that are load-bearing and documented at
// their helpers rather than here: a Shopify refund carries NO total, so
// `amountRefunded` is DERIVED from the successful refund transactions
// (`refundAmountRefunded`); the memo's total is made to EQUAL that amount by a
// synthetic remainder line (`adjustmentLine`, 10 §2.1); and a Shopify tax line
// carries NO id, so its identity is SYNTHESISED as `${orderId}:${title}`
// (`projectTaxLine`).
//
// The `order` projection also binds the PAID instant and the PAYING gateway
// (`paidAt` / `paidGateway`, accounting plan 29 §3.1) from the order's
// successful sale/capture transaction. The GraphQL order query carries
// `transactions` inline; the rule is at the "order payment" section.
//
// ── Field naming ─────────────────────────────────────────────────────────────
// Every projected key here is exactly the `sourcePath` (relative to its
// mapping's `rootPath`) a `shopify.connector.ts` mapping field reads — there is
// no more separate Layer-A "declared field key" distinct from the raw payload
// path, so the projection and the manifest must agree on literal key names.
// Money fields are already scaled to integer minor units by `decimalToMinorUnits`
// before landing in `fields` — see its docblock for why that has to happen here.
//
// ⚠️ Any field whose projected value is an ARRAY or an OBJECT is silently dropped
// by the fan-out before it reaches the field-value layer — no error, no null, no
// write — UNLESS it is bound to a JSON field (`raw`), which passes objects/arrays
// through. `tags` and `paymentGateways` are therefore delivered as COMMA STRINGS.

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { orderPaymentSourceFields } from '@auxx/sdk/financial-source'
import { shopifyGraphql, shopifyHttp } from './graphql/client'
import {
  CUSTOMERS_QUERY,
  type CustomersData,
  type GqlCustomer,
  toRawCustomer,
} from './graphql/customer'
import { legacyId } from './graphql/legacy-id'
import {
  completeOrders,
  type GqlOrder,
  ORDERS_FIRST,
  ORDERS_QUERY,
  type OrdersData,
  type RawOrderWithTransactions,
  toRawOrder,
} from './graphql/order'
import { fetchGraphqlPage } from './graphql/paged'
import {
  completeVariants,
  type GqlProduct,
  inventoryItemCosts,
  PRODUCTS_QUERY,
  type ProductRow,
  type ProductsData,
  STEERED_PRODUCT_QUERY,
  type SteeredProductData,
  toProductRow,
  toRawProduct,
} from './graphql/product'
import { fetchPaymentsStream } from './payments.connector.server'

const PAGE_SIZE = 250
// Probe: `first: 50` with 100 variants requested 219 points (plan §10); REST's 250 would exceed 1000.
const PRODUCT_PAGE_SIZE = 50

// ── shared projection helpers ────────────────────────────────────────────────

/** A Shopify REST address object (customer default_address / order ship/bill). */
export interface RawAddress {
  address1?: string | null
  address2?: string | null
  city?: string | null
  province?: string | null
  zip?: string | null
  country?: string | null
}

/**
 * Shape a Shopify address into the platform's ADDRESS_STRUCT value
 * (`{ street1, street2, city, state, zipCode, country }`). Returns null when the
 * order/customer has no address so the field stays empty rather than all-blank.
 */
function toAddressStruct(addr: RawAddress | null | undefined) {
  if (!addr) return null
  return {
    street1: addr.address1 ?? '',
    street2: addr.address2 ?? '',
    city: addr.city ?? '',
    state: addr.province ?? '',
    zipCode: addr.zip ?? '',
    country: addr.country ?? '',
  }
}

/**
 * Normalise Shopify's `tags` for a TAGS column.
 *
 * Shopify already hands `tags` over as a comma-joined STRING (`'vip, gift'`), and a
 * comma string is exactly what the platform's `normalizeFieldValue` splits into tag
 * values. Do NOT split it into an array here: the fan-out drops any array-shaped
 * source value before the field-value layer is reached (`hasArrayShapedSource` —
 * "connectors cannot source arrays"), so an array write is silently discarded.
 */
function toTagString(tags: string | null | undefined): string {
  return tags ?? ''
}

/**
 * Shopify returns `null` fulfillment_status for an unfulfilled order/line; project
 * it to the explicit `'unfulfilled'` value so the native SINGLE_SELECT chip is set.
 */
function fulfillmentStatus(raw: string | null | undefined): string {
  return raw ?? 'unfulfilled'
}

/**
 * Shopify reports money as a DECIMAL MAJOR-UNIT STRING (`"49.99"`). The platform
 * stores `FieldType.CURRENCY` as INTEGER MINOR UNITS (`4999`), so every money
 * field has to be scaled on the way out of this projection.
 *
 * This is the app's job, not the platform's: a mapping field's `sourcePath` is a
 * JSON path with no transform channel, and the platform cannot tell `49.99`-as-
 * dollars from `49.99`-as-cents once the unit is dropped. Passing these through
 * raw is what stored 139 Shopify money rows 100x low (money plan 37 §2.4).
 *
 * Returns null (not 0) for an absent value: a missing price is "no value", and
 * writing 0 would render a real $0.00.
 */
function decimalToMinorUnits(decimal: string | null | undefined): number | null {
  if (decimal === null || decimal === undefined || decimal === '') return null
  const parsed = Number.parseFloat(String(decimal))
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null
}

// ── customer stream ────────────────────────────────────────────────────────────
// Fetched over GraphQL and adapted back into this REST shape (`toRawCustomer`), so
// the projection below is unchanged (shopify-v3-graphql-plan.md D8).

export interface RawCustomer {
  id: number
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  orders_count: number
  total_spent: string
  note: string | null
  created_at: string
  updated_at: string
  default_address: RawAddress | null
  /** Resale/dealer exemption. The FLAG only: Shopify's `tax_exemptions[]` was
   *  empty on every order measured, so the exemption REASON and the resale
   *  certificate are not obtainable here and stay a manual, out-of-scope
   *  concern (plans/money/tasks/48-shopify-tax-data.md §4.4). */
  tax_exempt: boolean | null
}

/** Project one REST customer into a SOURCE-shaped record (fields keyed by sourcePath). */
function toCustomerRecord(c: RawCustomer): ConnectorRecord {
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ')
  return {
    streamKey: 'customer',
    externalId: String(c.id),
    // displayName tolerates guests/phone-only customers: email → name → id.
    displayName: c.email ?? (name || String(c.id)),
    fields: {
      id: String(c.id),
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      orders_count: c.orders_count,
      total_spent: c.total_spent,
      note: c.note,
      created_at: c.created_at,
      // Resale/dealer exemption (plans/money/tasks/48-shopify-tax-data.md §4.4).
      // Emitted HERE as well as on the order's embedded customer: a contact the
      // customer stream syncs before it has ever ordered would otherwise carry
      // no exemption flag at all, and for a dealer business this is the field
      // that separates "exempt for resale" from "simply never taxed".
      // `typeof` rather than truthiness so absent stays null and is never
      // defaulted to false (§8.2 - not supplied is not the same as false).
      tax_exempt: typeof c.tax_exempt === 'boolean' ? c.tax_exempt : null,
      // Flattened default-address scalars — bound onto the contact's city/region/country.
      default_address: c.default_address
        ? {
            city: c.default_address.city ?? null,
            province: c.default_address.province ?? null,
            country: c.default_address.country ?? null,
          }
        : null,
    },
  }
}

// ── order stream ───────────────────────────────────────────────────────────────

/**
 * Shopify's money "set" wrapper (`{ shop_money, presentment_money }`). Only
 * `shop_money` is ever read — it is the merchant's own currency, which is the one
 * the ledger posts in, and it is the STRING form of the amount (see `RawTaxLine`).
 */
export interface RawMoneySet {
  shop_money?: { amount?: string | null } | null
}

/**
 * One tax line — the same shape order-level and per line item. The measured key
 * set on live data is exactly `[channel_liable, price, price_set, rate, title]`;
 * note there is NO `id`, which is why `projectTaxLine` has to synthesise one.
 *
 * `price` (the bare scalar) is typed here for completeness and deliberately never
 * read: the payload carries the same value as a NUMBER on `price`/`total_tax` and
 * as a STRING on `*_set.shop_money.amount`, and only the string form is taken
 * through `decimalToMinorUnits`. Binding the bare scalar opens a second numeric
 * path into the ledger, which is where the 100x money bug lived last time.
 */
export interface RawTaxLine {
  title?: string | null
  rate?: number | string | null
  price?: number | string | null
  price_set?: RawMoneySet | null
  channel_liable?: boolean | null
}

/**
 * Parse a tax RATE (e.g. `0.0625`). Not money, so it must never go through
 * `decimalToMinorUnits` — a rate scaled by 100 is a 100x wrong rate. Accepts the
 * string form too, because this payload is not consistent about number vs string.
 */
function toRate(rate: number | string | null | undefined): number | null {
  if (rate === null || rate === undefined || rate === '') return null
  const parsed = typeof rate === 'number' ? rate : Number.parseFloat(rate)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Project one order-level tax line for the `tax_lines[]` fan-out.
 *
 * 🛑 A Shopify tax line carries NO `id`, so there is no natural external id to key
 * the record on and one has to be synthesised. `${orderId}:${title}:${rate}` is
 * the grain Shopify aggregates order-level tax lines on. Title alone is not enough:
 * Tennessee charges 7% on the full price and a separate 2.75% single-article tax
 * on the $1,600–$3,200 slice, both titled "Tennessee State Tax", and keying on
 * title collapsed them onto one record and lost the larger line (76 §1.2).
 *
 * `channelLiable` is a POSTING INPUT, not decoration: only a `false` line credits
 * `2200 Sales Tax Payable`, because a `true` line is remitted by the marketplace
 * facilitator and booking it would grow a liability the business does not owe. It
 * is emitted as null when absent, never defaulted to `false` — "not supplied" has
 * to stay distinguishable from "supplied as false".
 */
function projectTaxLine(orderId: string, tl: RawTaxLine) {
  const title = tl.title ?? null
  const rate = toRate(tl.rate)
  return {
    taxLineKey: title != null ? `${orderId}:${title}:${rate ?? ''}` : null,
    title,
    rate,
    // The `_set` STRING form, never the bare `price` number — see `RawTaxLine`.
    price: decimalToMinorUnits(tl.price_set?.shop_money?.amount ?? null),
    channelLiable: typeof tl.channel_liable === 'boolean' ? tl.channel_liable : null,
  }
}

/**
 * Total the tax a line item was charged, across every jurisdiction that taxed it.
 *
 * ⚠️ This is TOTALLING FIGURES THE PROVIDER SUPPLIED, not computing tax: every
 * addend is a `price` Shopify already calculated, and no rate is ever multiplied
 * and no total ever allocated. auxx does not calculate tax; it carries the answer
 * the provider produced, and a sum of those answers is still their answer.
 *
 * Deliberately a SCALAR rather than a per-line `tax_lines[]` fan-out: filing needs
 * jurisdiction detail per ORDER (which the order-level fan-out gives), and the
 * fulfillment entry needs one number per line. Fanning per-line detail out too
 * would multiply ~63k records over the order history to serve no question.
 *
 * Returns null when the provider sent no tax lines at all — "not supplied" is a
 * third state and must not collapse into "supplied as zero".
 */
function lineTaxTotal(taxLines: RawTaxLine[] | null | undefined): number | null {
  if (!taxLines) return null
  return taxLines.reduce(
    (sum, tl) => sum + (decimalToMinorUnits(tl.price_set?.shop_money?.amount ?? null) ?? 0),
    0,
  )
}

export interface RawLineItem {
  id: number | null
  title: string | null
  variant_title: string | null
  variant_id: number | null
  sku: string | null
  vendor: string | null
  quantity: number | null
  /** Units still awaiting shipment. Real Shopify field — makes the "paid but
   *  unfulfilled at the cutoff" deferred-revenue report exact rather than inferred
   *  from a status enum. */
  fulfillable_quantity: number | null
  price: string | null
  fulfillment_status: string | null
  product_id: number | null
  /** Whether this line was subject to tax at all — binds `line_item_taxable`.
   *  Distinct from "was taxed": an exempt customer buys a taxable line and pays
   *  nothing, and only this flag tells the two apart. */
  taxable: boolean | null
  /** Per-line tax, one entry per jurisdiction. Totalled into a single
   *  `taxTotal` scalar by `lineTaxTotal` — see its docblock for why it is not
   *  fanned out. */
  tax_lines: RawTaxLine[] | null
  /** Per-line discount allocation — how much of which order-level discount
   *  landed on THIS line. Feeds `netTotal` (price × qty − Σ amounts; accounting
   *  plan 29 §2.3) and is also folded into the order's `raw.discount_allocations`
   *  (money plan 37 §6/§8) since `line_item` gets no `raw` field of its own. */
  discount_allocations: Array<{ amount: string | null }> | null
}

/**
 * One line inside a fulfillment. Deliberately NOT `RawLineItem`: the shapes overlap,
 * but `quantity` here means "units shipped IN THIS FULFILLMENT", not units ordered.
 * Conflating the two is precisely the split-shipment bug these fields exist to avoid.
 */
export interface RawFulfillmentLine {
  id: number | null
  variant_id: number | null
  sku: string | null
  quantity: number | null
}

/**
 * One shipment against an order (`order.fulfillments[]`). This array is part of the
 * Order REST resource and rides `read_orders` — the `read_*_fulfillment_orders` scopes
 * govern the separate FulfillmentOrder endpoints, which this connector never calls.
 *
 * `created_at` is the SHIP DATE and the revenue-recognition trigger. Never `updated_at`:
 * that moves on every carrier tracking update, which would drag the recognition date
 * forward days after delivery.
 */
export interface RawFulfillment {
  id: number | null
  name: string | null
  /** Lifecycle: pending | open | success | cancelled | error | failure. */
  status: string | null
  /** Carrier tracking state; frequently null. Informational only. */
  shipment_status: string | null
  created_at: string | null
  updated_at: string | null
  tracking_number: string | null
  tracking_company: string | null
  tracking_url: string | null
  location_id: number | null
  line_items: RawFulfillmentLine[] | null
}

/** Per-line rollup of every non-cancelled fulfillment touching that line. */
interface LineFulfillmentDerivation {
  fulfilled_at: string | null
  last_fulfilled_at: string | null
  fulfilled_quantity: number
  shipment_count: number
  tracking_number: string | null
}

interface OrderFulfillmentDerivation {
  order: {
    first_fulfilled_at: string | null
    last_fulfilled_at: string | null
    shipment_count: number
    is_split_shipment: boolean
  }
  byLineId: Map<string, LineFulfillmentDerivation>
}

/**
 * Walk `order.fulfillments[]` once and roll it up to the order and to each line.
 *
 * Cancelled fulfillments are EXCLUDED from every date, count and quantity — a shipment
 * that was undone must not set a recognition date.
 *
 * Dates are compared by epoch and stored as the original ISO string. Shopify stamps
 * shop-local offsets, so `-05:00` and `-04:00` values coexist across a DST change and
 * text comparison would order them wrongly — which would land a shipment in the wrong
 * period at exactly the fiscal boundary this feature exists to get right.
 *
 * `tracking_number` is only carried onto a line when that line shipped exactly once.
 * With two shipments there is no single tracking number for the line, and guessing one
 * would be worse than leaving it null; `shipment_count` is the column that says so.
 */
function deriveFulfillments(o: RawOrder): OrderFulfillmentDerivation {
  const live = (o.fulfillments ?? []).filter((f) => f.status !== 'cancelled')

  let firstMs = Number.POSITIVE_INFINITY
  let lastMs = Number.NEGATIVE_INFINITY
  let firstAt: string | null = null
  let lastAt: string | null = null
  const byLineId = new Map<string, LineFulfillmentDerivation>()

  for (const f of live) {
    const at = f.created_at ?? null
    const ms = at ? Date.parse(at) : Number.NaN
    if (at && !Number.isNaN(ms)) {
      if (ms < firstMs) [firstMs, firstAt] = [ms, at]
      if (ms > lastMs) [lastMs, lastAt] = [ms, at]
    }

    for (const li of f.line_items ?? []) {
      if (li.id == null) continue
      const key = String(li.id)
      const cur: LineFulfillmentDerivation = byLineId.get(key) ?? {
        fulfilled_at: null,
        last_fulfilled_at: null,
        fulfilled_quantity: 0,
        shipment_count: 0,
        tracking_number: null,
      }
      cur.shipment_count += 1
      cur.fulfilled_quantity += typeof li.quantity === 'number' ? li.quantity : 0
      if (at && !Number.isNaN(ms)) {
        const curFirst = cur.fulfilled_at ? Date.parse(cur.fulfilled_at) : Number.POSITIVE_INFINITY
        const curLast = cur.last_fulfilled_at
          ? Date.parse(cur.last_fulfilled_at)
          : Number.NEGATIVE_INFINITY
        if (ms < curFirst) cur.fulfilled_at = at
        if (ms > curLast) cur.last_fulfilled_at = at
      }
      // Meaningful only for a single-shipment line — see the docblock.
      cur.tracking_number = cur.shipment_count === 1 ? (f.tracking_number ?? null) : null
      byLineId.set(key, cur)
    }
  }

  return {
    order: {
      first_fulfilled_at: firstAt,
      last_fulfilled_at: lastAt,
      shipment_count: live.length,
      is_split_shipment: live.length > 1,
    },
    byLineId,
  }
}

/**
 * One `fulfillment_line` as the `fulfillments[].line_items[]` fan-out sees it
 * (money plan 55 §5). `id` stays snake_case-shaped (a bare `id`) ON PURPOSE:
 * that exact literal is also a reference mapping's `sourcePath` in
 * `shopify.connector.ts`, the same discipline `line_item_id` follows on
 * `ProjectedCreditMemoLine` above.
 */
interface ProjectedFulfillmentLine {
  shopifyFulfillmentLineId: string | null
  quantity: number | null
  /** The ORDER line item id this fulfillment line shipped units of - REST's
   *  `RawFulfillmentLine.id` (`:439`), read here for the `.id` reference
   *  mapping to `line_item`, never for identity (see below). */
  id: string | null
}

/**
 * Project one line inside a fulfillment for the `fulfillments[].line_items[]`
 * fan-out.
 *
 * 🛑 IDENTITY IS SYNTHESISED. REST gives a fulfillment line no id of its own:
 * `RawFulfillmentLine.id` (`:439`) is the ORDER line item's id, so binding it
 * directly as identity would collide every fulfillment that ships units of
 * the same order line - exactly the (fulfillment, line) grain this feature
 * exists to keep. `${fulfillmentId}:${lineItemId}` is unique per dispatch per
 * line and follows the SAME precedent `projectTaxLine` set for a Shopify tax
 * line, which also carries no id (`${orderId}:${title}`) - stronger here,
 * since both halves of this key are real Shopify ids rather than a title
 * string (money plan 55 §5's "Identity" note).
 */
function projectFulfillmentLine(
  fulfillmentId: string | null,
  li: RawFulfillmentLine,
): ProjectedFulfillmentLine {
  const lineItemId = li.id != null ? String(li.id) : null
  return {
    shopifyFulfillmentLineId:
      fulfillmentId != null && lineItemId != null ? `${fulfillmentId}:${lineItemId}` : null,
    quantity: typeof li.quantity === 'number' ? li.quantity : null,
    id: lineItemId,
  }
}

/**
 * One `fulfillment` as the `fulfillments[]` fan-out sees it (money plan 55
 * §5), nested `line_items[]` for the child fan-out beneath it.
 */
interface ProjectedFulfillment {
  shopifyFulfillmentId: string | null
  name: string | null
  shippedAt: string | null
  status: string | null
  sequence: number
  cancelledAt: string | null
  trackingNumber: string | null
  trackingCompany: string | null
  trackingUrl: string | null
  line_items: ProjectedFulfillmentLine[]
}

/**
 * Project `order.fulfillments[]` into the fan-out `fulfillments[]` /
 * `fulfillments[].line_items[]` records the `fulfillment` / `fulfillment_line`
 * entities are built from (money plan 55 §5). This REPLACES what
 * `deriveFulfillments` used to throw away: every `(fulfillment, line)` tuple
 * lands as a record instead of being collapsed into a rollup.
 *
 * 🛑 **Cancelled fulfillments are emitted, not filtered** - the opposite of
 * `deriveFulfillments`, which still excludes them from the order/line rollup
 * it feeds (that rollup is a summary of what SHIPPED; this is the ledger of
 * what Shopify reported, full stop). A vanished record is indistinguishable
 * from one auxx never saw, and [50]'s inventory-relief netting reads
 * `fulfillment_line_quantity - quantity_relieved` per line: relief has to see
 * a cancelled fulfillment's lines to reverse against them (55 §5, §9.2).
 * `fulfillment_status: 'cancelled'` is what tells a reader, and a consumer, apart.
 *
 * `sequence` is 1-based, assigned by `created_at` ascending across EVERY
 * fulfillment INCLUDING cancelled ones - Shopify id ascending breaks a tie on
 * one timestamp. Numbering is not scoped to `live[]`-only on purpose: the full
 * fulfillments array is re-read and re-projected on every sync, so folding
 * cancelled fulfillments into the same ascending counter gives every record a
 * stable, deterministic sequence with no need to remember what was assigned
 * last run. Excluding cancelled ones from the count would make a
 * fulfillment's number depend on which OTHER fulfillments on the order happen
 * to be cancelled - a worse property for a number the poster's doc numbers
 * key on (55 §3).
 */
function projectFulfillments(o: RawOrder): ProjectedFulfillment[] {
  const ordered = [...(o.fulfillments ?? [])].sort((a, b) => {
    const aMs = a.created_at ? Date.parse(a.created_at) : Number.POSITIVE_INFINITY
    const bMs = b.created_at ? Date.parse(b.created_at) : Number.POSITIVE_INFINITY
    if (aMs !== bMs) return aMs - bMs
    return (a.id ?? 0) - (b.id ?? 0)
  })

  return ordered.map((f, index) => {
    const fulfillmentId = f.id != null ? String(f.id) : null
    const cancelled = f.status === 'cancelled'
    return {
      shopifyFulfillmentId: fulfillmentId,
      name: f.name,
      // The SHIP date, NEVER `updated_at` - `RawFulfillment`'s own docblock
      // says why: `updated_at` moves on every carrier tracking scan.
      shippedAt: f.created_at ?? null,
      status: f.status,
      sequence: index + 1,
      // Shopify's Fulfillment resource carries NO `cancelled_at` field at
      // all - `status` is the only signal it gives. `updated_at` is the best
      // available proxy: a cancelled fulfillment does not change again after
      // it is cancelled, so its last mutation IS the cancellation. `created_at`
      // would be wrong twice over: that is the SHIP date (see `shippedAt`
      // above), and it necessarily predates the cancellation.
      cancelledAt: cancelled ? (f.updated_at ?? null) : null,
      trackingNumber: f.tracking_number ?? null,
      trackingCompany: f.tracking_company ?? null,
      // The SINGULAR `tracking_url` field, never REST's `tracking_urls[]`
      // sibling: an array-shaped source value is silently dropped by the
      // fan-out (file header). Same discipline for `tracking_number` above
      // against `tracking_numbers[]`.
      trackingUrl: f.tracking_url ?? null,
      line_items: (f.line_items ?? []).map((li) => projectFulfillmentLine(fulfillmentId, li)),
    }
  })
}

/**
 * One money movement on a refund (`refund.transactions[]`). `kind` is
 * `refund | void | sale | authorization | capture`; `status` is
 * `success | pending | failure | error`.
 */
export interface RawRefundTransaction {
  id?: number | string | null
  kind?: string | null
  status?: string | null
  amount?: string | null
}

/**
 * One refunded line (`refund.refund_line_items[]`). Measured key set:
 * `[id, line_item, line_item_id, location_id, quantity, restock_type, subtotal,
 * subtotal_set, total_tax, total_tax_set]`.
 *
 * `subtotal` and `total_tax` (the bare scalars) are typed for completeness and
 * deliberately never read: the same number/string split as `RawTaxLine`.
 * `line_item` is Shopify's embedded copy of the order line, read only for its
 * `title` (the credit memo line's printed description). `location_id` is
 * omitted from the projection: nothing consumes it until the inventory leg
 * exists.
 */
export interface RawRefundLineItem {
  id?: number | null
  line_item_id?: number | null
  line_item?: { title?: string | null } | null
  quantity?: number | null
  subtotal?: number | string | null
  subtotal_set?: RawMoneySet | null
  total_tax?: number | string | null
  total_tax_set?: RawMoneySet | null
  restock_type?: string | null
}

/**
 * One refund on an order (`order.refunds[]`). Its twelve top-level properties are
 * `created_at, duties, id, note, order_adjustments, processed_at, refund_duties,
 * refund_line_items, refund_shipping_lines, restock, transactions, user_id`.
 * Note that **none of them is a total** (see `refundAmountRefunded`).
 *
 * `restock` is deliberately NOT typed or projected. Shopify deprecates it
 * ("use `restock_type` for refund line items instead") and it sits at the refund
 * level while the fact it describes is per line. It is in the payload, so it will
 * look bindable; `refund_line_items[].restock_type` is the field that carries it.
 */
export interface RawRefund {
  id?: number | null
  created_at?: string | null
  note?: string | null
  refund_line_items?: RawRefundLineItem[] | null
  transactions?: RawRefundTransaction[] | null
}

/** Provider-neutral disposition of a credited line: what happened to the goods. */
type CreditMemoLineDisposition = 'returned' | 'not_returned' | 'cancelled'

/** Why a channel credit memo exists (accounting plan 10 §2.1). */
type ChannelCreditMemoReason = 'cancellation' | 'allowance'

/**
 * Shopify's `restock_type` vocabulary, mapped onto auxx's own. Kept as a table so
 * an unrecognised token falls through to null rather than leaking into the field.
 */
const RESTOCK_TYPE_TO_DISPOSITION: Record<string, CreditMemoLineDisposition> = {
  return: 'returned',
  legacy_restock: 'returned',
  no_restock: 'not_returned',
  cancel: 'cancelled',
}

/**
 * Translate `restock_type` into the provider-neutral disposition.
 *
 * The stored value must never be Shopify's token. Other providers will send a
 * different vocabulary for the same three facts, and the cost of baking a
 * provider's words into stored data is already on the record: `1200 Shopify
 * Clearing` had to be renamed to `1200 Card Clearing` by a migration.
 *
 * An unknown token maps to null rather than to a guess: an unrecognised
 * disposition is "not supplied", not "not returned".
 */
function lineDisposition(restockType: string | null | undefined): CreditMemoLineDisposition | null {
  if (!restockType) return null
  return RESTOCK_TYPE_TO_DISPOSITION[restockType] ?? null
}

/**
 * The money that actually moved back on a refund, in integer minor units: the sum
 * of `transactions[]` where `kind === 'refund'` and `status === 'success'`.
 *
 * This is a DERIVATION over provider facts, NOT a transcription, and the name
 * has to keep saying so. A Shopify refund object has **no total field at all**;
 * a `refund_total` bound against one would have been null on every row, silently.
 * The value is defensible because it aggregates facts that each stand on their own
 * record (every transaction remains individually inspectable) and it invents no
 * rate and allocates nothing. **Do not rename it to a "total".** The credit
 * memo's own `credit_memo_total` is made to equal this figure by the remainder
 * line (`adjustmentLine`), which is what lets a channel memo land `settled` the
 * moment it is issued (accounting plan 10 §2.1).
 *
 * Failed and pending legs are excluded: money that did not move is not refunded.
 *
 * Returns null only when the provider sent no `transactions` array at all. An
 * empty or all-unsuccessful array yields 0, which is a real answer ("nothing
 * settled yet") and must stay distinguishable from "not supplied".
 */
function refundAmountRefunded(
  transactions: RawRefundTransaction[] | null | undefined,
): number | null {
  if (!transactions) return null
  return transactions
    .filter((t) => t.kind === 'refund' && t.status === 'success')
    .reduce((sum, t) => sum + (decimalToMinorUnits(t.amount) ?? 0), 0)
}

/**
 * Whether any refund transaction is still `pending`: the memo's `amountRefunded` is then
 * short of what will go back, so the platform holds the memo back from issuing (101 E9).
 */
function refundMoneyPending(transactions: RawRefundTransaction[] | null | undefined): boolean {
  return (transactions ?? []).some((t) => t.kind === 'refund' && t.status === 'pending')
}

/**
 * The reason a channel credit memo carries (accounting plan 10 §2.1):
 * `cancellation` when every refunded line was cancelled (goods that never
 * shipped), else `allowance`. A refund with no lines at all is a concession, a
 * "$100 off for an angry customer", which is an allowance (47 §3.1). A reviewer
 * can change it while the memo is a draft; the mapping binds it `fill_blank` so
 * a resync does not put it back.
 */
function creditMemoReason(
  dispositions: ReadonlyArray<CreditMemoLineDisposition | null>,
): ChannelCreditMemoReason {
  return dispositions.length > 0 && dispositions.every((d) => d === 'cancelled')
    ? 'cancellation'
    : 'allowance'
}

/** Printed description of the remainder line (accounting plan 10 §2.1). */
const ADJUSTMENT_LINE_DESCRIPTION = 'Refund adjustment'

/**
 * One `credit_memo_line` as the `refunds[].refund_line_items[]` fan-out sees it.
 * Money is integer minor units. `line_item_id` stays snake_case ON PURPOSE: that
 * exact literal is also a reference mapping's `rootPath` in `shopify.connector.ts`.
 */
interface ProjectedCreditMemoLine {
  shopifyRefundLineId: string | null
  description: string | null
  quantity: number | null
  unitPrice: number | null
  subtotal: number | null
  taxTotal: number | null
  disposition: CreditMemoLineDisposition | null
  sortOrder: number
  line_item_id: string | null
}

/**
 * Project one refunded line. `subtotal` and `taxTotal` are TRANSCRIBED from the
 * `_set` strings; `unitPrice` is `subtotal / qty` (10 §2.2) and is the one
 * derived number here, rounded to a minor unit. The subtotal stays the fact:
 * the totals hook sums line subtotals, never `unitPrice * qty`, so the rounding
 * can never leak into the memo total.
 */
function projectRefundLine(rl: RawRefundLineItem, sortOrder: number): ProjectedCreditMemoLine {
  const quantity = typeof rl.quantity === 'number' ? rl.quantity : null
  // Both take the `_set` STRING form, never the bare `subtotal` / `total_tax`
  // numbers sitting beside them (47 §4.1); see `RawTaxLine`.
  const subtotal = decimalToMinorUnits(rl.subtotal_set?.shop_money?.amount ?? null)
  const taxTotal = decimalToMinorUnits(rl.total_tax_set?.shop_money?.amount ?? null)
  return {
    shopifyRefundLineId: rl.id != null ? String(rl.id) : null,
    // Defaults to the order line's title, the way a native memo line defaults to
    // its line item's name (10 §2.2).
    description: rl.line_item?.title ?? null,
    quantity,
    unitPrice:
      subtotal != null && quantity != null && quantity > 0 ? Math.round(subtotal / quantity) : null,
    subtotal,
    taxTotal,
    disposition: lineDisposition(rl.restock_type),
    sortOrder,
    // Reference back to the order line this credited. NOT camelCased: this
    // literal path is also a reference mapping's `rootPath`.
    line_item_id: rl.line_item_id != null ? String(rl.line_item_id) : null,
  }
}

/**
 * The REMAINDER LINE (accounting plan 10 §2.1): one extra `credit_memo_line`
 * with no line item, so that `credit_memo_total == credit_memo_amount_refunded`
 * by construction and a channel memo is `settled` the moment it is issued.
 *
 * Shopify sends no total, and 8 of 11 observed refunds moved money with NO line
 * items at all (47 §3): a concession or a discrepancy adjustment. This line is
 * what carries that money onto the memo. It is the same thing a native
 * concession is, a line with no line item, so there is one rule for both.
 *
 *   subtotal = amountRefunded - sum(line subtotals) - sum(line tax)
 *
 * Tax is 0 (the lines already carry the tax the provider supplied), the
 * disposition is null (nothing came back), and the sign is whatever the
 * arithmetic says: a negative remainder (lines exceed the money moved, e.g.
 * goods credited but part of the money kept) is still what makes the total
 * agree, so it is emitted too. Nothing is emitted when the remainder is zero or
 * when `amountRefunded` is not supplied at all (no `transactions[]`), because
 * then there is nothing to reconcile against.
 *
 * Identity is SYNTHETIC, `${refund.id}:adjustment`, because Shopify has no row
 * for this line. It is stable across syncs, so re-ingest is idempotent: the sink
 * rewrites the same record rather than adding a second one. It sorts last.
 */
function adjustmentLine(
  refundId: string,
  amountRefunded: number | null,
  lines: ReadonlyArray<ProjectedCreditMemoLine>,
): ProjectedCreditMemoLine | null {
  if (amountRefunded == null) return null
  const credited = lines.reduce((sum, l) => sum + (l.subtotal ?? 0) + (l.taxTotal ?? 0), 0)
  const remainder = amountRefunded - credited
  if (remainder === 0) return null
  return {
    shopifyRefundLineId: `${refundId}:adjustment`,
    description: ADJUSTMENT_LINE_DESCRIPTION,
    quantity: 1,
    unitPrice: remainder,
    subtotal: remainder,
    taxTotal: 0,
    disposition: null,
    sortOrder: lines.length,
    line_item_id: null,
  }
}

/**
 * Project one refund as a channel-sourced `credit_memo` for the `refunds[]`
 * fan-out, with its lines nested for the child fan-out beneath it.
 *
 * `refund_line_items` and `line_item_id` stay snake_case ON PURPOSE: those exact
 * literals are also mapping `rootPath`s in `shopify.connector.ts`, exactly like
 * `line_items[].variant_id`. Every other key is camelCase like the rest of this
 * projection.
 *
 * `contactExternalId` is the order's Shopify customer id, the same external id
 * the order's embedded `customer` branch binds as the contact's identity
 * (`customerId`), so the memo's `credit_memo_contact` reference resolves to the
 * very contact `order_contact` points at. Null for a guest order: the reference
 * then clears rather than guesses.
 */
function projectRefund(r: RawRefund, contactExternalId: string | null) {
  const refundId = r.id != null ? String(r.id) : null
  const amountRefunded = refundAmountRefunded(r.transactions)
  const lines = (r.refund_line_items ?? []).map(projectRefundLine)
  const adjustment = refundId != null ? adjustmentLine(refundId, amountRefunded, lines) : null
  return {
    // The refund's own Shopify id: its identity. A refund is append-only at the
    // source (there is no delete/void/reverse operation), so this id is stable.
    shopifyRefundId: refundId,
    // Every ingested memo arrives as a channel DRAFT (10 §1, §5.4): reviewed and
    // issued in auxx, or auto-issued by the ingest job when unambiguous. These
    // three are bound `fill_blank` so a resync never overwrites the platform's
    // status transitions or a reviewer's reason.
    status: 'draft' as const,
    source: 'channel' as const,
    reason: creditMemoReason(lines.map((l) => l.disposition)),
    // The date the refund HAPPENED, which is when the credit takes effect and
    // what the ledger dates from. Never ingest time: this connector is
    // manual-only, so the gap between a refund occurring and auxx seeing it can
    // cross a period close (47 §5.3).
    issuedAt: r.created_at ?? null,
    note: r.note ?? null,
    amountRefunded,
    moneyPending: refundMoneyPending(r.transactions),
    customerId: contactExternalId,
    refund_line_items: adjustment ? [...lines, adjustment] : lines,
  }
}

// ── order payment ─────────────────────────────────────────────────────────────
//
// `paidAt` / `paidGateway` (accounting plan 29 §3.1, bound to `order_paid_at` /
// `order_paid_gateway`): the `processed_at` and `gateway` of the order's
// SUCCESSFUL `sale` or `capture` transaction. The rule:
//
//   1. Paid at checkout with ONE listed gateway (the overwhelming case): the
//      order's `processed_at` IS the paid instant, which is also what Shopify
//      itself dates the sale by, and the one listed gateway IS the paying one.
//      No extra call.
//   2. More than one gateway, or an order carrying `payment_terms` (inferred
//      from the transactions, plan D9): read the transactions. `payment_gateway_names` includes FAILED attempts (a
//      declined Affirm, then a card, reads `['affirm','shopify_payments']`),
//      and a terms order pays days or weeks after `processed_at`.
//   3. Not paid yet (`pending`, `authorized`, `partially_paid`, `voided`, ...):
//      both empty. Paying bumps `updated_at`, so the next incremental sync
//      sees the flip to `paid` and fills them then.
//
// Transactions arrive inline with every order (src/graphql/order.ts), never
// truncated: a list that could be cut off is re-queried or the page throws.
// `read_orders` covers `Order.transactions`.

/**
 * One order transaction as either the REST (`sale` / `success`) or the GraphQL
 * (`SALE` / `SUCCESS`) API spells it. `resolvePaidTransaction` compares
 * case-insensitively so the same helper reads both.
 */
export interface OrderTransactionLike {
  id?: string | null
  amountSet?: { presentmentMoney?: { amount: string; currencyCode: string } | null } | null
  settlementCurrency?: string | null
  parentTransaction?: { id: string } | null
  paymentId?: string | null
  test?: boolean
  kind?: string | null
  status?: string | null
  gateway?: string | null
  processedAt?: string | null
  /** The gateway's authorisation code — typed and stable. */
  authorizationCode?: string | null
  /** The gateway's raw receipt. Shopify documents it as gateway-specific and NOT a
   *  stable contract, so `gatewayTransactionIdOf` is the only reader. */
  receiptJson?: unknown
}

/**
 * The gateway's own transaction id off `receiptJson` — Authorize.net's `transId`
 * on this merchant (authorize-net plan §6A), which is what joins a settled batch
 * member back to this order.
 *
 * The ONLY place `receiptJson` is parsed, and it never throws: an absent or
 * oddly-shaped receipt is an unrecognised item, not a failed transaction.
 */
export function gatewayTransactionIdOf(receiptJson: unknown): string | null {
  if (!receiptJson || typeof receiptJson !== 'object' || Array.isArray(receiptJson)) return null
  const id = (receiptJson as { transaction_id?: unknown }).transaction_id
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  return typeof id === 'string' && id.length > 0 ? id : null
}

export interface OrderPayment {
  /** `processed_at` of the successful sale/capture transaction, ISO string. */
  paidAt: string | null
  /** Its gateway handle, e.g. `shopify_payments`. */
  paidGateway: string | null
}

const UNPAID: OrderPayment = { paidAt: null, paidGateway: null }

/** `financial_status` values under which the order has been paid in full. */
const PAID_FINANCIAL_STATUSES = new Set(['paid', 'partially_refunded', 'refunded'])

function isPaid(o: Pick<RawOrder, 'financial_status'>): boolean {
  return PAID_FINANCIAL_STATUSES.has(o.financial_status ?? '')
}

/**
 * Whether the paid instant has to come from the order's transactions (rule 2
 * above) instead of being read off the order itself (rule 1). Never true for
 * an unpaid order: there is nothing to look up yet.
 */
export function needsPaidTransactionLookup(
  o: Pick<RawOrder, 'financial_status' | 'payment_gateway_names' | 'payment_terms'>,
): boolean {
  if (!isPaid(o)) return false
  return (o.payment_gateway_names ?? []).length > 1 || o.payment_terms != null
}

/**
 * The LATEST successful `sale` or `capture` among an order's transactions. For a
 * paid order that is the instant it became fully paid (a second capture on a
 * partially captured authorization, a terms order paying its last schedule).
 * Null when there is none; a failed or pending attempt never qualifies.
 */
export function resolvePaidTransaction(transactions: OrderTransactionLike[]): OrderPayment | null {
  const processedMs = (tx: OrderTransactionLike): number => {
    const ms = Date.parse(tx.processedAt ?? '')
    return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms
  }
  let best: OrderTransactionLike | undefined
  for (const tx of transactions) {
    const kind = tx.kind?.toLowerCase()
    if (kind !== 'sale' && kind !== 'capture') continue
    if (tx.status?.toLowerCase() !== 'success') continue
    if (!best || processedMs(tx) > processedMs(best)) best = tx
  }
  if (!best) return null
  return { paidAt: best.processedAt ?? null, paidGateway: best.gateway ?? null }
}

/**
 * Every distinct gateway with a successful `sale` or `capture` (58 §7, D12): a
 * declined attempt names a gateway too but never sold anything, so it is
 * dropped rather than carried onto `paymentGateways`.
 */
export function resolveSuccessfulGateways(transactions: OrderTransactionLike[]): string[] {
  const gateways: string[] = []
  for (const tx of transactions) {
    const kind = tx.kind?.toLowerCase()
    if (kind !== 'sale' && kind !== 'capture') continue
    if (tx.status?.toLowerCase() !== 'success') continue
    if (tx.gateway && !gateways.includes(tx.gateway)) gateways.push(tx.gateway)
  }
  return gateways
}

/**
 * `paidAt` / `paidGateway` for one order. `transactionsByOrderId` holds the
 * looked-up transactions for the orders on this page that needed them; an order
 * that needed a lookup and got none (deleted between the two calls, or outside
 * the 60-day order window) stays EMPTY rather than guessed, and the platform's
 * fork falls back to its own single-gateway rule.
 */
export function resolveOrderPayment(
  o: Pick<
    RawOrder,
    'id' | 'financial_status' | 'payment_gateway_names' | 'payment_terms' | 'processed_at'
  >,
  transactionsByOrderId: ReadonlyMap<string, OrderTransactionLike[]>,
): OrderPayment {
  if (!isPaid(o)) return UNPAID
  if (needsPaidTransactionLookup(o)) {
    const transactions = transactionsByOrderId.get(String(o.id))
    return (transactions && resolvePaidTransaction(transactions)) ?? UNPAID
  }
  // Rule 1: paid at checkout. A $0 / fully-discounted order lists no gateway at
  // all and is still `paid` at `processed_at`; its gateway is null, not ''.
  return { paidAt: o.processed_at, paidGateway: o.payment_gateway_names?.[0] ?? null }
}

export interface RawOrder {
  id: number
  name: string | null
  order_number?: number
  email: string | null
  currency: string | null
  total_price: string | null
  subtotal_price: string | null
  total_tax: string | null
  total_discounts: string | null
  /** Present on the Order resource by default. §6/§8: transcribed onto the
   *  new `order_shipping_total` system field — sell-side documents had no
   *  shipping term before this. */
  total_shipping_price_set: { shop_money: { amount: string | null } } | null
  financial_status: string | null
  fulfillment_status: string | null
  cancel_reason: string | null
  /**
   * Gateways across ALL of the order's transactions — the routing key for the
   * checkout debit. `order.gateway` and `order.processing_method` are both deprecated;
   * this is the current field. It includes gateways from FAILED transactions, so a
   * declined-Affirm-then-paid-by-card order reads `['affirm','shopify_payments']` and a
   * naive `includes('affirm')` mis-routes. This raw list is never mutated; a
   * multi-value order resolves `paidGateway` AND the projected `paymentGateways`
   * (58 §7, D12) against the order's transactions, dropping the failed names.
   */
  payment_gateway_names: string[] | null
  /**
   * Present on a Plus B2B / deferred-payment order, `null` on a checkout-paid
   * one. Read here ONLY as the "paid later than `processed_at`" signal that
   * routes the order to the transaction lookup (see the order payment section);
   * the terms themselves are not projected (gap-0 §4.4 owns that).
   */
  payment_terms?: { payment_terms_name?: string | null } | null
  tags: string | null
  note: string | null
  created_at: string
  updated_at: string
  processed_at: string | null
  cancelled_at: string | null
  /** Shipments. Present on the Order resource by default — the connector sends no
   *  `fields=` param, and Shopify's `fields` filter is top-level-only. */
  fulfillments: RawFulfillment[] | null
  shipping_address: RawAddress | null
  billing_address: RawAddress | null
  customer: {
    id: number | null
    email: string | null
    first_name: string | null
    last_name: string | null
    /** Resale/dealer exemption. The FLAG is available; Shopify's
     *  `tax_exemptions[]` array was empty on every order measured, so the
     *  exemption REASON and the certificate are not obtainable here. */
    tax_exempt: boolean | null
  } | null
  line_items: RawLineItem[] | null
  // Modelled natively as of money plan 47/48 and accounting plan 10: fanned out
  // into `credit_memo` / `credit_memo_line` / `tax_line` records, scaled through
  // `decimalToMinorUnits`. Deliberately NOT also dumped into `raw`: see the
  // note there.
  refunds: RawRefund[] | null
  tax_lines: RawTaxLine[] | null
  // ── Not modelled anywhere in the native order/line_item — folded verbatim
  // into `raw` (money plan 37 §6/§8) instead of a resync-to-answer round trip.
  shipping_lines: unknown[] | null
  discount_applications: unknown[] | null
}

/** Project one REST order into a SOURCE-shaped record (fields keyed by sourcePath,
 *  relative to the mapping's rootPath, see the file header). `transactionsByOrderId`
 *  holds the order's inline GraphQL transactions (see the order payment section). */
function toOrderRecord(
  o: RawOrder,
  transactionsByOrderId: ReadonlyMap<string, OrderTransactionLike[]> = new Map(),
  sourceShopDomain: string,
): ConnectorRecord {
  const fulfilled = deriveFulfillments(o)
  const payment = resolveOrderPayment(o, transactionsByOrderId)
  // The contact's external id, shared by the embedded `customer` branch and the
  // credit memos' contact reference so both edges land on the same contact.
  const customerId = o.customer?.id != null ? String(o.customer.id) : null
  return {
    streamKey: 'order',
    externalId: String(o.id),
    displayName: o.name ?? `#${o.order_number ?? o.id}`,
    fields: {
      shopify_id: String(o.id),
      ...orderPaymentSourceFields({
        sourceAccount: {
          providerKey: 'shopify',
          externalAccountId: sourceShopDomain,
          environment: 'live',
        },
        orderExternalId: String(o.id),
        sourceUpdatedAt: o.updated_at ?? null,
        complete:
          transactionsByOrderId.has(String(o.id)) &&
          (transactionsByOrderId.get(String(o.id))?.length ?? 0) < 250,
        transactions: (transactionsByOrderId.get(String(o.id)) ?? []).map((transaction) => ({
          id: transaction.id?.split('/').slice(-1)[0] ?? '',
          version: 2,
          raw: transaction,
          kind:
            (
              {
                SALE: 'receipt',
                CAPTURE: 'receipt',
                REFUND: 'refund',
                AUTHORIZATION: 'authorization',
                VOID: 'void',
              } as Record<string, string>
            )[transaction.kind?.toUpperCase() ?? ''] ?? 'unknown',
          status:
            transaction.status?.toUpperCase() === 'SUCCESS'
              ? 'confirmed'
              : ['FAILURE', 'ERROR'].includes(transaction.status?.toUpperCase() ?? '')
                ? 'failed'
                : 'pending',
          amount: transaction.amountSet?.presentmentMoney?.amount ?? '',
          currency: transaction.amountSet?.presentmentMoney?.currencyCode ?? '',
          processedAt: transaction.processedAt ?? null,
          gateway: transaction.gateway ?? null,
          settlementCurrency: transaction.settlementCurrency ?? null,
          parentTransactionId: transaction.parentTransaction?.id.split('/').slice(-1)[0] ?? null,
          creditMemoExternalId:
            (o.refunds ?? [])
              .find((refund) =>
                (refund.transactions ?? []).some(
                  (leg) => String(leg.id) === transaction.id?.split('/').slice(-1)[0],
                ),
              )
              ?.id?.toString() ?? null,
          paymentId: transaction.paymentId ?? null,
          authorizationCode: transaction.authorizationCode ?? null,
          gatewayTransactionId: gatewayTransactionIdOf(transaction.receiptJson),
          test: transaction.test === true,
        })),
      }),
      name: o.name,
      email: o.email,
      currency: o.currency,
      totalPrice: decimalToMinorUnits(o.total_price),
      subtotalPrice: decimalToMinorUnits(o.subtotal_price),
      totalTax: decimalToMinorUnits(o.total_tax),
      totalDiscounts: decimalToMinorUnits(o.total_discounts),
      totalShipping: decimalToMinorUnits(o.total_shipping_price_set?.shop_money?.amount ?? null),
      // Shopify's total_discounts is always an absolute amount at the order
      // aggregate level (never a percent) — the projection states it as a
      // constant so `order_discount_type` has something to transcribe (§6).
      discountType: 'amount' as const,
      financialStatus: o.financial_status,
      fulfillmentStatus: fulfillmentStatus(o.fulfillment_status),
      // Only set on a cancelled order — leave null otherwise (no enum value to write).
      cancelReason: o.cancel_reason,
      // Joined to a COMMA STRING, never emitted as an array: the fan-out drops
      // array-shaped source values outright. `''` (not null) for an order with no
      // gateway — a $0 / fully-discounted order is legitimately empty, not unknown.
      // Rule 1's single gateway has nothing to filter; a rule-2 lookup projects
      // only its successful transactions' gateways (58 §7, D12), dropping a
      // declined attempt's name.
      paymentGateways: (
        needsPaidTransactionLookup(o)
          ? resolveSuccessfulGateways(transactionsByOrderId.get(String(o.id)) ?? [])
          : (o.payment_gateway_names ?? [])
      ).join(','),
      // The paid instant and the gateway that actually took the money
      // (`order_paid_at` / `order_paid_gateway`, accounting plan 29 §3.1).
      // Both null until the order is paid; see the order payment section for
      // when they come from `processed_at` and when from a transaction lookup.
      paidAt: payment.paidAt,
      paidGateway: payment.paidGateway,
      tags: toTagString(o.tags),
      note: o.note,
      createdAt: o.created_at,
      processedAt: o.processed_at,
      cancelledAt: o.cancelled_at,
      // Fulfillment rollup — FLATTENED directly onto the order's fields, not
      // nested under a `derived` object: a contributing mapping's `sourcePath`
      // is relative to its rootPath, so there is no schema-key indirection left
      // to hide the nesting behind (see the file header).
      firstFulfilledAt: fulfilled.order.first_fulfilled_at,
      lastFulfilledAt: fulfilled.order.last_fulfilled_at,
      shipmentCount: fulfilled.order.shipment_count,
      isSplitShipment: fulfilled.order.is_split_shipment,
      shippingAddress: toAddressStruct(o.shipping_address),
      billingAddress: toAddressStruct(o.billing_address),
      customer: o.customer
        ? {
            // `id` keys the contributing contact item to the same external id the
            // `customer` stream emits, so the order→contact edge resolves.
            id: customerId,
            email: o.customer.email,
            firstName: o.customer.first_name,
            lastName: o.customer.last_name,
            // Resale/dealer exemption. Null when absent, never defaulted to
            // false: for a dealer business this is the difference between "sold
            // to an exempt customer" and "was simply never taxed", and defaulting
            // it would erase exactly that distinction.
            taxExempt: typeof o.customer.tax_exempt === 'boolean' ? o.customer.tax_exempt : null,
          }
        : null,
      // Raw array — the platform fans each element out per the `line_items[]` mapping.
      line_items: (o.line_items ?? []).map((li, index) => {
        const unitPriceMinor = decimalToMinorUnits(li.price) ?? 0
        const quantity = typeof li.quantity === 'number' ? li.quantity : 0
        const discountMinor = (li.discount_allocations ?? []).reduce(
          (sum, allocation) => sum + (decimalToMinorUnits(allocation.amount) ?? 0),
          0,
        )
        // Per-line fulfillment rollup. A line never touched by a live
        // fulfillment gets an explicit zeroed shape rather than a missing
        // key, so the columns read as "nothing shipped" instead of "not
        // synced".
        const derivation: LineFulfillmentDerivation = (li.id != null
          ? fulfilled.byLineId.get(String(li.id))
          : undefined) ?? {
          fulfilled_at: null,
          last_fulfilled_at: null,
          fulfilled_quantity: 0,
          shipment_count: 0,
          tracking_number: null,
        }
        return {
          // The line item's own Shopify id — its declared identity, a stable
          // per-line id that replaces the positional `{orderId}:{index}` fallback.
          shopifyId: li.id != null ? String(li.id) : null,
          name: productQualifiedTitle(li.title ?? String(li.id), li.variant_title),
          title: li.title,
          variantTitle: li.variant_title,
          sku: li.sku,
          vendor: li.vendor,
          quantity: typeof li.quantity === 'number' ? li.quantity : null,
          fulfillableQuantity:
            typeof li.fulfillable_quantity === 'number' ? li.fulfillable_quantity : null,
          price: decimalToMinorUnits(li.price),
          // Transcribed line total (money plan 37 §6.2), GROSS: price × qty,
          // in integer minor units to avoid float drift. Until accounting plan
          // 29 §2.3 this deducted the line's discount allocations; it no longer
          // does, because the line total a customer sees here must match what
          // Shopify's admin shows per line, and that is the pre-discount amount.
          lineTotal: unitPriceMinor * quantity,
          // The allocated NET the ledger posts from (accounting plan 29 §2.3):
          // price × qty − Σ this line's discount allocations, which is what
          // `lineTotal` used to carry. Equal to `lineTotal` on an undiscounted
          // line. Σ over the order's lines is Shopify's `subtotal_price`; the
          // gross sum is not whenever a discount applied.
          netTotal: unitPriceMinor * quantity - discountMinor,
          // Position within the order — line_item_sort_order.
          index,
          fulfillmentStatus: fulfillmentStatus(li.fulfillment_status),
          // Whether the line was subject to tax — binds the already-registered
          // `line_item_taxable`. Null when absent, never defaulted.
          taxable: typeof li.taxable === 'boolean' ? li.taxable : null,
          // One scalar per line, summed from the provider's OWN per-jurisdiction
          // tax lines — totalling supplied figures, not calculating tax. This is
          // what lets the fulfillment entry use exact per-line tax on a split
          // shipment instead of allocating the order total pro rata.
          taxTotal: lineTaxTotal(li.tax_lines),
          // Stringified to match the product stream's variant identity so the
          // line→part reference resolves (money plan 37 §7.2/§10.5). NOT
          // renamed to camelCase: this exact literal path is also the
          // reference mapping's `rootPath` in shopify.connector.ts.
          variant_id: li.variant_id != null ? String(li.variant_id) : null,
          // Per-line fulfillment rollup, flattened (see the order-level comment
          // above) — these are `@app:shopify:*` app fields (§7.3), not native.
          fulfilledAt: derivation.fulfilled_at,
          lastFulfilledAt: derivation.last_fulfilled_at,
          fulfilledQuantity: derivation.fulfilled_quantity,
          shipmentCount: derivation.shipment_count,
          trackingNumber: derivation.tracking_number,
        }
      }),
      // Raw array: the platform fans each element out per the `fulfillments[]`
      // mapping into the native `fulfillment` entity, and each element's
      // nested `line_items[]` out again into `fulfillment_line` beneath it
      // (money plan 55 §5). Cancelled fulfillments ARE included - see
      // `projectFulfillments`'s docblock. Re-delivered in full on every sync
      // and keyed on Shopify's stable `fulfillment.id` (or the synthesised
      // `${fulfillmentId}:${lineItemId}` for a line), the same idempotency-
      // for-free shape `refunds[]` below already relies on: nothing here is
      // append-only, so re-ingest just rewrites the same records.
      fulfillments: projectFulfillments(o),
      // Raw array: the platform fans each element out per the `refunds[]`
      // mapping into a native channel `credit_memo`, and each element's nested
      // `refund_line_items[]` (the provider's lines plus the synthetic remainder
      // line) out again into `credit_memo_line` beneath it. A refund is a
      // SNAPSHOT re-delivered on every order sync and keyed on a stable
      // `refund.id`, so re-ingest is idempotent for free; a second refund on an
      // already-refunded order still lands, because it is a new external id even
      // when the order root itself hashes identically.
      refunds: (o.refunds ?? []).map((r) => projectRefund(r, customerId)),
      // Raw array — fanned out per the `tax_lines[]` mapping into `tax_line`
      // records. Records, not a JSON blob, because the question these exist to
      // answer is "tax by jurisdiction over a period", which is an aggregation,
      // and an aggregation wants rows. Multi-jurisdiction is the NORM (85% of
      // taxed orders carry more than one line), which is also why the scalar
      // `order_tax_rate` field can never be bound.
      tax_lines: (o.tax_lines ?? []).map((tl) => projectTaxLine(String(o.id), tl)),
      // Everything the native order/line_item does not model (§6/§8) — stored
      // verbatim (no unit scaling: this is a query-later dump, not a bound
      // field) so an accrual question never needs a resync to answer.
      // Key names deliberately mirror Shopify's own field names (not camelCased
      // like the rest of this projection) — this is a query-later dump of the
      // provider's own shapes, not a bound field.
      raw: {
        // `refunds` and `tax_lines` were dumped here until money plan 47/48
        // modelled them natively. Removed rather than kept alongside: `raw` is
        // UNSCALED by design ("a query-later dump, not a bound field"), so a
        // second copy of the same money in decimal strings beside the native
        // records in minor units is exactly the ambiguity §4.1 is about. The
        // native `credit_memo` / `credit_memo_line` / `tax_line` records are
        // the answer now, and they carry more than the dump did.
        shipping_lines: o.shipping_lines ?? [],
        discount_applications: o.discount_applications ?? [],
        // Shopify carries this PER LINE ITEM, not at the order level; line_item
        // gets no `raw` field of its own (§6/§8), so every line's allocations
        // are gathered here, tagged with the line they came from.
        discount_allocations: (o.line_items ?? []).flatMap((li) =>
          (li.discount_allocations ?? []).map((allocation) => ({
            line_item_id: li.id != null ? String(li.id) : null,
            amount: allocation.amount,
          })),
        ),
      },
    },
  }
}

// ── product stream ─────────────────────────────────────────────────────────────

/**
 * A product variant in the REST shape (`src/graphql/product.ts` adapts GraphQL into it).
 * `id`/`inventory_item_id` arrive as numbers; both are stringified in projection so
 * the identity and webhook join-key comparisons stay string-based (like line items).
 */
export interface RawVariant {
  id: number | null
  sku: string | null
  title: string | null
  price: string | null
  inventory_quantity: number | null
  inventory_item_id: number | null
  position: number | null
  option1: string | null
  option2: string | null
  option3: string | null
  image_id: number | null
  /** `false` marks a non-shipping variant (warranty, installation): a service. */
  requires_shipping?: boolean | null
  updated_at: string
}

/** An entry of a REST product's `images[]`; `image` is the featured one (position 1). */
export interface RawProductImage {
  id: number
  src: string | null
}

export interface RawProduct {
  id: number
  title: string | null
  body_html: string | null
  vendor: string | null
  product_type: string | null
  handle: string | null
  status: string | null
  tags: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  image?: RawProductImage | null
  images?: RawProductImage[] | null
  variants?: RawVariant[] | null
}

/**
 * Product-qualified variant title, projected onto `variants[].title` (the
 * part's `part_title`) so parts synced from a multi-variant product are
 * tellable apart in pickers. Shopify's raw variant title is ALL present option
 * values joined with " / " ("Grey / 42 / Wool") — and the literal "Default
 * Title" for single-variant products, which would otherwise name every such
 * part identically.
 */
function variantDisplayTitle(p: RawProduct, v: RawVariant): string {
  // Prefer Shopify's pre-joined title; re-join option1–3 ourselves if it's absent.
  // "Default Title" is the placeholder option value on no-option products — never a
  // real option — so it's dropped from the join and caught below when it IS the title.
  const optionsTitle =
    v.title ??
    [v.option1, v.option2, v.option3].filter((o) => o && o !== 'Default Title').join(' / ')
  return productQualifiedTitle(p.title ?? String(p.id), optionsTitle)
}

/** "Product - Variant", or the product alone when the variant is Shopify's "Default Title". */
function productQualifiedTitle(productTitle: string, variantTitle: string | null): string {
  if (!variantTitle || variantTitle === 'Default Title') return productTitle
  return `${productTitle} - ${variantTitle}`
}

/**
 * Project one REST-shaped product into a SOURCE-shaped record. `externalId` is the numeric
 * product id stringified; `costs` maps inventory item id → cost per item.
 */
export function toProductRecord(
  p: RawProduct,
  costs: ReadonlyMap<string, string | null>,
): ConnectorRecord {
  // Image URLs pass through verbatim: the CDN's `?v=` changes when an image is
  // replaced, and the platform compares the URL exactly to skip re-downloads.
  const imageSrcById = new Map((p.images ?? []).map((img) => [img.id, img.src]))
  return {
    streamKey: 'product',
    externalId: String(p.id),
    displayName: p.title ?? String(p.id),
    fields: {
      shopify_id: String(p.id),
      title: p.title,
      bodyHtml: p.body_html,
      vendor: p.vendor,
      productType: p.product_type,
      handle: p.handle,
      status: p.status,
      tags: toTagString(p.tags),
      createdAt: p.created_at,
      publishedAt: p.published_at,
      updatedAt: p.updated_at,
      imageUrl: p.image?.src ?? null,
      // Raw array — the platform fans each element out per the `variants[]`
      // mapping into the native `part`. `shopifyId` is the
      // variant's identity and `inventoryItemId` the webhook join key; both
      // stringified — same discipline as the line-item fan-out.
      variants: (p.variants ?? []).map((v) => ({
        shopifyId: v.id != null ? String(v.id) : null,
        sku: v.sku,
        title: variantDisplayTitle(p, v),
        price: decimalToMinorUnits(v.price),
        unitCost:
          v.inventory_item_id != null
            ? decimalToMinorUnits(costs.get(String(v.inventory_item_id)))
            : null,
        inventoryQuantity: typeof v.inventory_quantity === 'number' ? v.inventory_quantity : null,
        inventoryItemId: v.inventory_item_id != null ? String(v.inventory_item_id) : null,
        position: typeof v.position === 'number' ? v.position : null,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        imageUrl:
          (v.image_id != null ? imageSrcById.get(v.image_id) : undefined) ?? p.image?.src ?? null,
        requiresShipping: typeof v.requires_shipping === 'boolean' ? v.requires_shipping : null,
        // Option VALUES of `part_kind`; only an explicit `false` is a service.
        partKind: v.requires_shipping === false ? 'service' : 'finished_good',
        sellable: true,
      })),
    },
  }
}

// ── webhook-steered product fetch ────────────────────────────────────────────────

/**
 * Steered fetch for an `inventory_levels/update` delivery, which carries only the
 * `inventory_item_id`: one query resolves item → variant → product with the crawl's
 * selection, so the `variants[]` fan-out refreshes every sibling variant.
 */
async function fetchSteeredProduct(
  args: ConnectorExecuteArgs,
  inventoryItemId: string,
): Promise<ConnectorFetchResult> {
  const http = shopifyHttp(args.connection)
  const res = await shopifyGraphql<SteeredProductData>(http, STEERED_PRODUCT_QUERY, {
    id: `gid://shopify/InventoryItem/${legacyId(inventoryItemId)}`,
  })
  if (!res.ok) {
    return { records: [], nextState: {}, rateLimited: { retryAfterMs: res.retryAfterMs } }
  }
  const product = res.data.inventoryItem?.variant?.product
  // Item deleted/detached between the delivery and this fetch — nothing to refresh.
  if (!product) return { records: [], nextState: { backfillComplete: true } }

  const completed = await completeVariants([product], http)
  if (!completed.ok) {
    return { records: [], nextState: {}, rateLimited: { retryAfterMs: completed.retryAfterMs } }
  }
  return {
    records: completed.data.map((p) => toProductRecord(toRawProduct(p), inventoryItemCosts(p))),
    nextState: { backfillComplete: true },
  }
}

export default async function shopifySync(
  args: ConnectorExecuteArgs,
): Promise<ConnectorFetchResult> {
  // Webhook-steered partial fetch (inventory_levels/update → product stream): the
  // platform passes the delivery's declared paths as triggerContext — fetch ONLY the
  // affected product instead of crawling the collection.
  if (args.streamKey === 'product' && args.triggerContext?.resourceId) {
    return fetchSteeredProduct(args, args.triggerContext.resourceId)
  }
  switch (args.streamKey) {
    case 'payout':
    case 'balance_transaction':
      return fetchPaymentsStream(args)
    case 'customer':
      return fetchGraphqlPage<CustomersData, GqlCustomer, RawCustomer>(args, {
        query: CUSTOMERS_QUERY,
        first: PAGE_SIZE,
        connection: (data) => data.customers,
        toRaw: toRawCustomer,
        toRecord: toCustomerRecord,
      })
    case 'order': {
      const shopDomain = shopifyHttp(args.connection).shopDomain
      // No status filter: GraphQL `orders` returns open, closed and cancelled alike.
      return fetchGraphqlPage<OrdersData, GqlOrder, RawOrderWithTransactions>(args, {
        query: ORDERS_QUERY,
        first: ORDERS_FIRST,
        connection: (data) => data.orders,
        complete: completeOrders,
        toRaw: toRawOrder,
        toRecord: (order) =>
          toOrderRecord(order, new Map([[String(order.id), order.transactions]]), shopDomain),
      })
    }
    case 'product':
      // ⚠️ EXPLICITLY UNFILTERED: a snapshot stream archives every product missing from
      // the crawl, so any filter turns "filtered out" into "deleted". Forcing `snapshot`
      // keeps an `updated_at` term out of the query; an unknown status throws in the adapter.
      return fetchGraphqlPage<ProductsData, GqlProduct, ProductRow>(
        { ...args, mode: 'snapshot' },
        {
          query: PRODUCTS_QUERY,
          first: PRODUCT_PAGE_SIZE,
          connection: (data) => data.products,
          complete: completeVariants,
          toRaw: toProductRow,
          toRecord: (row) => toProductRecord(row.product, row.costs),
        },
      )
    default:
      throw new Error(`shopify: unknown stream "${args.streamKey}"`)
  }
}
