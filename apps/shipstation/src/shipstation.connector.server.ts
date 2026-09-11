// src/shipstation.connector.server.ts
//
// Server handler for the single ShipStation data connector. Runs inside the
// app-runtime sandbox and serves TWO streams:
//
//   • `label`    → GET /v2/labels. One record per PURCHASED LABEL, carrying the
//                  label's own packages. Contributes into the native hidden
//                  `shipment` / `parcel` entities (shared-shipment-entities-
//                  proposal.md).
//   • `shipment` → GET /v2/shipments. One record per SHIPMENT, carrying only
//                  the three values that live on the shipment resource and are
//                  not on a label at all. Contributes into the same native
//                  `shipment` rows the label stream already resolves.
//
// Both streams are `syncMode: 'incremental'`. The label stream used to be a
// snapshot; §"the two-cursor label delta" below is why it no longer has to be.
//
// ── The two-cursor label delta ───────────────────────────────────────────────
// `/v2/labels` has no `modified_at` FILTER and, worse, never returns
// `modified_at` on a label at all, even though `sort_by=modified_at` is
// accepted. So the obvious "sort by modified_at desc, stop at the watermark"
// delta is not writable: the stop value is a field the API sorts on and never
// hands back. Do not reach for it.
//
// What IS writable is two cursors, each with a watermark the response actually
// carries (build plan §5, "The delta that IS available"):
//
//   1. NEW LABELS. `created_at_start=<created watermark>`, `sort_by=created_at`,
//      ascending, over frozen windows — the same crawl the backfill runs, with a
//      moving start instead of the fixed `importStart`.
//   2. VOIDS. `label_status=voided`, `sort_by=voided_at`, DESCENDING, stopping at
//      the first label whose `voided_at` is at or before the void watermark.
//
// A void is precisely the change a new-labels-only watermark misses, and it is
// the single most important state change this connector exists to carry (the
// probe found 117 voided labels). Covering it separately is the entire reason
// this stream can stop being a snapshot.
//
// The residual gap is a label change that is neither a creation nor a void,
// principally `tracking_status` drift.
//
// ⚠️ That gap got EXPENSIVE on 2026-09-11. It was an accepted loss while
// `tracking_status` was provenance only; it now decides `shipment_status`
// (status plan §3), so a shipment's status freezes at whatever the label said
// when its creation was first read, and a box delivered a day later still reads
// `in_transit`. Nothing here can close it: `/v2/labels` has no modified-time
// filter and never returns a modified time, so there is no third sweep to write.
// The fix is the per-box tracking stream in status plan §6, which supersedes
// this value at rung 1 of the ladder.
//
// ── Two watermarks, one engine slot ──────────────────────────────────────────
// The platform persists ONE watermark string per stream (`nextState.updatedSince`
// in, `state.updatedSince` back out) and folds successive values with a LEXICAL
// max. The label stream needs two, so they are encoded as
// `<createdISO>|<voidedISO>`. `Date#toISOString()` is always 24 characters, so a
// lexical comparison of that pair is a component-wise comparison of the two
// halves, and both halves only ever move forward — which makes the engine's max
// the right answer rather than an accident. See `encodeLabelWatermark`.
//
// ⚠️ A half is advanced ONLY when its own sweep has been crawled to exhaustion.
// A sweep that errors throws, so nothing advanced is ever returned; a sweep
// stopped by the page budget returns no watermark at all. Never advance a
// watermark past a window that errored.
//
// ── Which phase this stream is in ────────────────────────────────────────────
// NOT `args.mode`. The run's mode is decided connector-wide (it is `incremental`
// only when EVERY stream is already steady), and a stream that is steady while a
// sibling still backfills runs its watermark catch-up inside a run whose mode
// says `snapshot`. The reliable signal is the state itself: a stored cursor says
// what it is, and a stored watermark can only exist because a backfill finished.
// `readLabelCursor` / `readShipmentCursor` encode exactly that.
//
// ── Why normalization lives HERE and not in the mapping ──────────────────────
// A `ConnectorMapping` field is a `sourcePath` → `target` binding with no
// transform hook, so any value that has to arrive already-shaped must be shaped
// on this side. That is the proposal's §8d decision. Two rules govern it:
//
//   1. Enumerate the provider's REAL values from live evidence, never from
//      vendor documentation (build plan §2). The probe observed exactly one
//      shipment status value, `label_purchased`.
//   2. Anything unrecognized becomes `unknown`, NEVER a guess. That is the only
//      reason the enum carries an `unknown` member.
//
// ── 🛑 The honest limitation, stated once ────────────────────────────────────
// Per-box carrier status HAS NO WRITER in this pass. FedEx and UPS have no
// connectors, and a label's package object carries an id, a tracking number, a
// sequence, weight and dimensions and NO status field of any kind, so
// `parcel_status` stays null and the only status information reaching this file
// is LABEL-level. That value is a coarse indicator, not a fact about any
// individual box. Probe §3:
//
//   • the three-box label reported `tracking_status: 'in_transit'` while
//     `GET /v2/labels/{id}/track` returned `Not Yet In System` (`NY`) with null
//     ship and delivery dates, and
//   • VOIDED labels also reported `tracking_status: 'in_transit'`.
//
// What follows from that is what the value may be used FOR, and that answer
// changed on 2026-09-11 (status plan §2). It may NOT be fanned out across a
// label's 2 to 28 boxes: FedEx ground parcels route independently and arrive on
// their own days, so one value stamped on all of them is manufactured agreement,
// and "I got 5 of my 6 boxes" is precisely the case a customer calls about. It
// MAY decide the ONE shipment-level status, because ShipStation allows one live
// label per shipment and a label carries exactly one `tracking_status`, so
// nothing is duplicated and nothing is invented.
//
// Until then `shipmentStatus` was derived from the LABEL LIFECYCLE alone, and
// all 135 live shipments read `label_created` while ShipStation was reporting 57
// of them delivered. `deriveShipmentStatus` is the ladder that replaced it. The
// raw string is still copied onto every parcel as `providerTrackingStatus`,
// unnormalized, as provenance and nothing more: it is what ShipStation said, not
// where any box is.
//
// ── Which ship date ─────────────────────────────────────────────────────────
// The LABEL's `ship_date` is used. Probe §2 recorded the shipment's
// (`2026-09-10T00:00:00Z`) and the label's (`2026-09-10T07:00:00Z`) DISAGREEING,
// and did not establish the timezone contract, so neither is authoritative. The
// label's is chosen for two reasons: this stream emits labels, so it is the date
// that travels with the artifact being emitted and needs no second request per
// label; and the shipment's midnight-UTC value has the shape of a date-only
// value stamped as UTC, which loses more information than it carries.
// ⚠️ This value NEVER replaces the accounting fulfillment date on an order. That
// date comes from Shopify's `fulfillments[].created_at` and stays there.
//
// ── Connection ──────────────────────────────────────────────────────────────
// Auth is resolved from `args.connection` ONLY, never the ambient tool-runtime
// `getConnection()` helper, which would let a sync pick up a default account.
// `connection.value` IS the V2 API key (a `secret` connection with no variables).

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { RateLimitError } from '@auxx/sdk/server'
import { type RawLabel, projectLabel } from './tools/shared/project-label'
import { type ShipStationQuery, shipstationApi } from './tools/shared/shipstation-api'

/** The label stream: one record per purchased label, with its packages. */
export const LABEL_STREAM_KEY = 'label'

/** The shipment stream: one record per shipment, enriching the same rows. */
export const SHIPMENT_STREAM_KEY = 'shipment'

/**
 * Page size. 50 is used because 50 is the size the live probe actually issued
 * (`/v2/labels?page_size=50`); ShipStation's maximum is documented but not
 * verified against this account, and a rejected page size would fail the whole
 * crawl rather than degrade.
 */
const PAGE_SIZE = 50

/**
 * Defensive offset ceiling. ShipStation documents a pagination ceiling for
 * SHIPMENTS; whether the same ceiling applies to LABELS is UNVERIFIED: the
 * probe never paged deep enough to find out. Rather than assume it does not
 * exist, the crawl subdivides its time window whenever a window holds more rows
 * than this, which is correct under either answer and costs nothing when the
 * ceiling is higher than assumed.
 */
const MAX_OFFSET = 10_000

/**
 * Floor on window subdivision. Below this a window is crawled up to the offset
 * ceiling and the shortfall is logged rather than split further, because
 * halving forever is a worse failure than a loud partial crawl.
 */
const MIN_WINDOW_MS = 60_000

/**
 * Whole-run page budget. 2,000 pages x 50 rows is 100,000 labels, against the
 * 4,290 the probed account holds in total. Hitting it means something is wrong
 * with the cursor, not that the account is enormous, so the crawl stops and says
 * so instead of looping.
 */
const MAX_PAGES_PER_RUN = 2_000

/**
 * Connector config this handler reads. Declared as a zod schema in
 * `shipstation.connector.ts`; this interface is the shape that file must
 * produce, exported so the two cannot drift apart silently.
 */
export interface ShipstationConnectorConfig {
  /**
   * Fixed start of the import window (ISO date or datetime). It is a FIXED
   * boundary, never a moving cutoff: moving it forward would silently abandon
   * history already imported, which build plan §5 rules out.
   *
   * It remains a floor on BOTH streams after the delta landed. The new-labels
   * cursor starts from it on the first run and from the watermark afterwards;
   * the void sweep and the shipment crawl apply it as an explicit filter, so a
   * label voided today on a shipment created before the configured start is
   * still out of scope. Without that the delta would quietly import history the
   * snapshot deliberately excluded.
   *
   * This is the connector's ENTIRE config. `shipstation.connector.ts` declares
   * `z.object({ importStart: z.iso.datetime() })` and nothing else, and in
   * particular no store filter. The pagination below is still driven off the RAW
   * page rather than the projected one, because both delta sweeps DO filter
   * locally and an emptied page must never read as the end of the crawl.
   */
  importStart?: string
}

// ── watermark codec ──────────────────────────────────────────────────────────

/** The label stream's two delta floors, both ISO-8601 instants. */
export interface LabelWatermarks {
  /** Labels CREATED at or after this are re-read by the new-labels sweep. */
  created: string
  /** Labels VOIDED strictly after this are re-read by the void sweep. */
  voided: string
}

/**
 * Encode both label watermarks into the single string the platform persists.
 *
 * The platform folds successive watermarks with a LEXICAL max
 * (`maxWatermark`), so the encoding has to make that fold correct rather than
 * merely survive it. `Date#toISOString()` is always exactly 24 characters, so
 * `<created>|<voided>` compares component-wise: the created halves decide,
 * and the voided halves break the tie. Both halves only ever move forward
 * within a run, so the lexically greater pair is always the later one.
 *
 * 🛑 Never widen either half to a variable-length format. A pair whose first
 * component can change length stops comparing component-wise and the engine's
 * max silently picks the wrong one.
 */
export function encodeLabelWatermark(watermarks: LabelWatermarks): string {
  return `${toIso(watermarks.created)}|${toIso(watermarks.voided)}`
}

/**
 * Read both label watermarks back, or null when the stream has none yet (a
 * first run, or a forced re-backfill, which clears the watermark).
 */
export function decodeLabelWatermark(raw: unknown): LabelWatermarks | null {
  if (typeof raw !== 'string') return null
  const [created, voided] = raw.split('|')
  if (!created || !voided) return null
  if (!Number.isFinite(Date.parse(created)) || !Number.isFinite(Date.parse(voided))) return null
  return { created, voided }
}

/** Normalize to the 24-character ISO form the codec above depends on. */
function toIso(value: string): string {
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) {
    throw new Error(`shipstation: refusing to encode a watermark from "${value}"`)
  }
  return new Date(ms).toISOString()
}

// ── normalized vocabulary ────────────────────────────────────────────────────

/**
 * The twelve `ShipmentStatus` values, matching the preset enum the native
 * `shipment_status` field carries. Any value emitted for `shipmentStatus` is one
 * of these, exactly.
 */
export type ShipmentStatus =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'attempted_delivery'
  | 'delayed'
  | 'partially_delivered'
  | 'delivered'
  | 'exception'
  | 'returned_to_shipper'
  | 'unknown'

/**
 * Roll-up precedence, ATTENTION-FIRST (proposal §6, confirmed by the owner
 * 2026-09-10).
 *
 * The ordering answers one question: when a shipment's boxes carry different
 * statuses, which one does the shipment show? A three-box shipment with one box
 * in `exception` reads `exception`, so the problem is visible on a ticket, in
 * preference to `partially_delivered`, which would hide the bad box behind
 * progress until somebody opened the shipment.
 *
 * `unknown` is last, so a box we know nothing about never outranks a box we do.
 */
const SHIPMENT_STATUS_PRECEDENCE: readonly ShipmentStatus[] = [
  'exception',
  'returned_to_shipper',
  'attempted_delivery',
  'delayed',
  'partially_delivered',
  'delivered',
  'ready_for_pickup',
  'out_for_delivery',
  'in_transit',
  'picked_up',
  'label_created',
  'unknown',
]

/**
 * Normalize the LIVE label's `tracking_status` into a transit state, or `null`
 * meaning "no transit opinion" (status plan §3.2).
 *
 * An EXHAUSTIVE `switch` over the values observed live, never a `Set<string>`
 * membership test: a set hides the member nobody added, while a switch makes
 * every recognized value a line somebody had to write. The 2026-09-11 probe saw
 * exactly three across 50 labels, `in_transit`, `delivered` and `unknown`. A
 * fourth is added HERE, from a live payload, never from vendor documentation.
 *
 * 🛑 `null` is NOT our `unknown`, and that distinction is the entire reason for
 * the nullable return type. A null falls through to rung 3 and the shipment
 * reads `label_created`, because we are holding a live label and a label
 * demonstrably was printed. Writing `unknown` there would ERASE a fact we hold.
 * "The provider said nothing useful" and "we know nothing" are different states,
 * and `unknown` belongs to the second alone: rung 4, no live label at all.
 */
export function normalizeLabelTrackingStatus(
  raw: string | null | undefined
): ShipmentStatus | null {
  switch (raw) {
    case 'in_transit':
      return 'in_transit'
    case 'delivered':
      return 'delivered'
    // The provider declining to answer, which is exactly "no transit opinion".
    // Deliberately NOT passed through to our own `unknown`; see above.
    case 'unknown':
      return null
    default:
      return null
  }
}

/** One parcel as the roll-up sees it: voided or not, plus whatever status it has. */
export interface RollUpParcel {
  voided: boolean
  /** Null when nothing is known about this box; treated as `unknown`. */
  status: ShipmentStatus | null
}

/**
 * Roll a shipment's parcels up into ONE `ShipmentStatus` (proposal §6).
 *
 * The rule, in order:
 *
 * 1. **Voided parcels are excluded entirely.** A voided label's boxes are
 *    history; they say nothing about where the shipment is.
 * 2. A shipment with **no active parcels is `unknown`**.
 * 3. **`delivered` only when EVERY active parcel is delivered.** Any mix of
 *    delivered and not-delivered is `partially_delivered`, which is the one
 *    state a single box cannot be in, and it is why the shipment enum has a
 *    value the parcel enum does not.
 * 4. Otherwise the **highest-precedence status present** wins, attention-first
 *    (see `SHIPMENT_STATUS_PRECEDENCE`).
 *
 * This is rung 1 of `deriveShipmentStatus`, the best evidence there is and the
 * one this connector cannot produce: see that function for why it is reached
 * only once something writes real per-box status.
 *
 * Kept pure and separate from the fetch so it can be unit-tested against the
 * mixed cases that matter, and so the FedEx/UPS connectors have something to
 * reuse when they arrive to write real per-box status.
 */
export function rollUpShipmentStatus(parcels: readonly RollUpParcel[]): ShipmentStatus {
  const active = parcels.filter((p) => !p.voided)
  if (active.length === 0) return 'unknown'

  const statuses = active.map((p) => p.status ?? 'unknown')
  if (statuses.every((s) => s === 'delivered')) return 'delivered'

  // Not all delivered, so a delivered box makes the SHIPMENT partially delivered.
  const effective: ShipmentStatus[] = statuses.map((s) =>
    s === 'delivered' ? 'partially_delivered' : s
  )
  for (const candidate of SHIPMENT_STATUS_PRECEDENCE) {
    if (effective.includes(candidate)) return candidate
  }
  return 'unknown'
}

/**
 * Decide ONE `ShipmentStatus` for a shipment, best evidence first (status plan
 * §3.1).
 *
 * ```
 * 1. a parcel carries real per-box status -> roll them up  (best; empty today)
 * 2. the live label's tracking_status normalizes -> use it (133 of 135 live)
 * 3. a live label exists                  -> label_created (1)
 * 4. no live label at all                 -> unknown       (1)
 * ```
 *
 * Rung 1 is vacuous from THIS connector and will stay that way: a ShipStation
 * package carries no status field, so every parcel this app can build has a null
 * status and the ladder falls straight through to rung 2. It is written and
 * tested anyway because this function is the ladder itself, and the per-box
 * tracking stream (status plan §6) is what fills rung 1 in. A box-level fact has
 * to beat a label-level indicator the moment one exists, and putting the
 * precedence here means that needs no second decision later.
 *
 * Rung 4 is the only honest use of `unknown`: no active parcel means no live
 * label, so we hold nothing at all, not even "a label was printed".
 *
 * 🛑 Deliberately NOT clamped forward-only (status plan §3.4). `tracking_status`
 * has unverified provenance, so a stale read could in principle flap a shipment
 * backwards, but `delivered -> returned_to_shipper` is a legitimate transition
 * and a monotonic clamp would block it. Let it overwrite, and watch for flapping.
 */
export function deriveShipmentStatus(
  parcels: readonly RollUpParcel[],
  liveLabelTrackingStatus: string | null | undefined
): ShipmentStatus {
  const active = parcels.filter((p) => !p.voided)
  if (active.length === 0) return 'unknown'
  // `!= null` so an undefined status counts as absent too. A parcel with no
  // status must not pull the decision into the roll-up, which would answer
  // `unknown` and quietly outrank the live label's real transit state.
  if (active.some((p) => p.status != null)) return rollUpShipmentStatus(parcels)
  return normalizeLabelTrackingStatus(liveLabelTrackingStatus) ?? 'label_created'
}

// ── raw payload ──────────────────────────────────────────────────────────────

/**
 * A provider money value: a DECIMAL `amount` alongside its own currency code.
 * Every amount observed on this account is `usd`.
 *
 * 🛑 The decimal is why `toMinorUnits` exists. It must never be written through
 * to a CURRENCY field as-is.
 */
export interface RawMoney {
  currency?: string | null
  amount?: number | null
}

/**
 * The label's downloadable renderings, an OBJECT rather than a string. `pdf`,
 * `zpl` and `href` were present on all 50 probed labels and `png` on 49, with
 * `href` duplicating `pdf`. The PDF is the one a person prints.
 */
export interface RawLabelDownload {
  pdf?: string | null
  png?: string | null
  zpl?: string | null
  href?: string | null
}

/**
 * A label as the connector reads it. Extends the tool-side `RawLabel` with the
 * shipment-shaped fields the connector needs and the tools do not.
 *
 * ⚠️ `shipment_number` and `store_id` are NOT on the read shape of a label. The
 * V2 schema puts them on the `shipment` resource, and the `shipment` object a
 * label carries is `writeOnly`, so it never comes back on a GET. They are kept
 * on this interface because the payload is read permissively and a future
 * provider change would then land for free, but the fields that actually
 * populate them are bound by the `shipment` stream, not here. Build plan §9
 * recorded them as "empty or partial" for exactly this reason.
 *
 * ⚠️ `shipment_status` is here for the same permissive reason and NOTHING READS
 * IT any more. The 2026-09-11 probe's 50 raw labels carry no such key at all,
 * which is why it used to normalize to `label_created` on every single label and
 * why every shipment read that value. The transit signal is `tracking_status`.
 */
export interface RawConnectorLabel extends RawLabel {
  shipment_number?: string | null
  shipment_status?: string | null
  store_id?: string | null
  external_shipment_id?: string | null
  /** What the merchant paid for this label. 50/50 live, and a DECIMAL. */
  shipment_cost?: RawMoney | null
  /** `amount: 0` on all 50 probed labels: this merchant insures nothing. */
  insurance_cost?: RawMoney | null
  label_download?: RawLabelDownload | null
  /**
   * ⚠️ Typed `unknown` on purpose. It was null on all 50 probed labels, which
   * follows from `insurance_cost.amount` being 0 on every one of them, so its
   * wire shape has NEVER been observed and declaring one here would be a guess
   * dressed as a type. `readInsuranceClaim` decides what may be written.
   */
  insurance_claim?: unknown
}

/** A shipment as the `shipment` stream reads it, off `GET /v2/shipments`. */
export interface RawShipment {
  shipment_id: string
  shipment_number?: string | null
  store_id?: string | null
  /** `pending | processing | label_purchased | cancelled` (V2 enum). */
  shipment_status?: string | null
  created_at?: string | null
  modified_at?: string | null
}

/** The shared `paged_list_response_body` envelope both list endpoints extend. */
interface PagedEnvelope {
  total?: number
  page?: number
  pages?: number
}

/** The `/v2/labels` list envelope. */
interface RawLabelPage extends PagedEnvelope {
  labels?: RawConnectorLabel[]
}

/** The `/v2/shipments` list envelope. */
interface RawShipmentPage extends PagedEnvelope {
  shipments?: RawShipment[]
}

/**
 * Shipment statuses that mean a label was bought at some point, and therefore
 * that this shipment is one the `label` stream also lands on.
 *
 * 🛑 The `shipment` stream is an ENRICHMENT, not a second source of truth. It
 * exists to fill `shipment_number` and `storeId`, which are on the shipment
 * resource and on nothing else. Emitting `pending` and `processing` shipments
 * would mint hidden `shipment` rows with no parcels, no tracking number and no
 * name, for every draft in the account — records nobody asked this connector to
 * create. `cancelled` IS emitted: a cancelled shipment usually got there by
 * having its label voided, and the shipment payload cannot tell that apart from
 * a cancellation before any label was bought.
 */
const SHIPMENT_STATUSES_WITH_A_LABEL = new Set(['label_purchased', 'cancelled'])

/**
 * Is this label voided?
 *
 * `voided` is the boolean the payload carries, and it is the reliable half.
 *
 * The lifecycle status is checked as well, under BOTH spellings. The V2 property
 * is `status`; `label_status` is the name of its schema and the name of the query
 * parameter, and no label object in the spec carries a `label_status` property —
 * which is why probe §3 recorded this value as "null on live list and get
 * responses". Both are read so that neither a corrected reader nor an old
 * fixture goes quiet. When either DOES say `voided`, believe it.
 *
 * Reading all three in the permissive direction errs toward excluding a box from
 * active tracking, which is the safe direction: a wrongly-active voided box would
 * be reported to a customer as in transit.
 */
export function isLabelVoided(label: RawConnectorLabel): boolean {
  return Boolean(label.voided) || label.status === 'voided' || label.label_status === 'voided'
}

// ── projection ───────────────────────────────────────────────────────────────

/**
 * Convert a provider money value into the INTEGER MINOR UNITS a CURRENCY field
 * stores (status plan §7.1).
 *
 * `field-value-helpers.ts:389` is explicit: "CURRENCY is NUMBER's shape exactly:
 * an integer minor-unit amount." ShipStation sends
 * `{"currency":"usd","amount":16.54}`, and a mapping field has no transform
 * hook, so the multiply happens here or a $16.54 label is stored as 16 cents.
 *
 * 🛑 `Math.round`, never a bare `* 100`. Binary floating point puts the probe's
 * `74.1 * 100` at `7409.999999999999`, so anything that truncates loses a cent
 * on a real amount from this account (`70.9 * 100` lands on the other side, at
 * `7090.000000000001`). Rounding is exact for any two-decimal input, because the
 * representation error is many orders of magnitude below half a unit.
 *
 * ⚠️ `16.54 * 100` is NOT one of those cases: it evaluates to exactly `1654`.
 * The status plan and its brief both cite it as the example, which is wrong, and
 * a reader who checks the cited value and finds it fine could conclude the whole
 * hazard was imaginary. 74.1 and 70.9 are the two real ones in the 50 labels.
 *
 * ⚠️ Two decimal places is assumed, which is what the field's own
 * `options.decimals` declares and what every observed amount carries. A
 * zero-decimal currency (JPY) would need the exponent; nothing on this account
 * is non-USD, and whether a connector mapping can emit per-row currency meta at
 * all is still open (status plan §7.1).
 */
function toMinorUnits(money: RawMoney | null | undefined): number | null {
  const amount = money?.amount
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return null
  return Math.round(amount * 100)
}

/**
 * Read `insurance_claim` into the TEXT column, or refuse.
 *
 * 🛑 The wire shape is UNKNOWN. It was null on all 50 probed labels, which
 * follows from `insurance_cost.amount` being 0 on every one of them (nothing
 * uninsured can be claimed), so the field is forward-looking by owner decision
 * rather than evidenced. A string is written through; anything else is NOT,
 * because `JSON.stringify`-ing a structure into a text column produces a value
 * no reader can use and no filter can match, and it would look like the shape
 * had been decided when it had not.
 *
 * The warning is how the shape gets decided. It names the KEYS and not the
 * values, because a claim plausibly carries personal data. Whoever sees one
 * picks the single scalar that belongs in this column and records which.
 */
function readInsuranceClaim(raw: unknown): string | null {
  if (typeof raw === 'string') return raw.trim() === '' ? null : raw
  if (raw === null || raw === undefined) return null
  const shape =
    typeof raw === 'object'
      ? `object with keys ${Object.keys(raw as Record<string, unknown>).join(',')}`
      : typeof raw
  console.warn(
    `[shipstation] insurance_claim arrived as ${shape}; its wire shape has never been ` +
      'observed, so nothing is written. Pick the ONE scalar that belongs in the text column ' +
      'and record which, rather than serialising the structure into it.'
  )
  return null
}

/** Per-sweep switches on the label projection. */
export interface LabelProjectionOptions {
  /**
   * Do not emit `masterTrackingNumber` at all.
   *
   * 🛑 Set by the VOID sweep, and the reason is ordering, not tidiness. The void
   * sweep runs AFTER the created sweep within one steady run and re-reads labels
   * the created sweep already emitted, so a voided label's number would arrive
   * after the live replacement's and overwrite the shipment's display name with
   * a dead tracking number. The created sweep's ascending order is what makes
   * the voided-master fallback safe, and that order does not exist here.
   */
  suppressMasterTrackingNumber?: boolean
}

/**
 * Project one raw label into the source-shaped record the mappings read.
 *
 * Package identity, sequencing and master detection are delegated to
 * `projectLabel` (the tool-side projection), which already encodes the probe's
 * two hard-won facts: ids stay STRINGS (`se-*` is never coerced to a number) and
 * display order comes from `sequence`, never array position: in the observed
 * three-box label the master was returned LAST.
 *
 * 🛑 Shipment-level fields (`shipmentNumber`, `carrier`, `service`, `shipDate`,
 * `parcelCount`, `shipmentStatus`, and the label money and documents
 * `costMinor`, `insuranceCostMinor`, `labelUrl`, `insuranceClaim`) are emitted
 * ONLY for a non-voided label. This is load-bearing, not hygiene.
 *
 * Probe §3 found one shipment carrying two labels, one voided and one active,
 * both sharing the shipment id, so both records map onto the SAME shipment row.
 * When both land in one slice the entity sink runs a slice dedupe
 * (`entity-sink.ts:1045`) in which the FIRST record to resolve the instance wins
 * the writes and the second is recorded as `lostSliceDedupe`. Which of the two
 * wins depends on page order, so without this filter the shipment's carrier,
 * service, ship date and status would be non-deterministic from run to run,
 * sometimes the live label's, sometimes a voided label's. Emitting them from the
 * live label only removes the race instead of hoping to win it.
 *
 * The voided label's parcels are still emitted, flagged `voided: true`, because
 * the void history is the point.
 *
 * ## `masterTrackingNumber` is the one exception, and deliberately so
 *
 * A VOIDED label emits it too, from the CREATED sweep only. It is the shipment's
 * PRIMARY DISPLAY FIELD (`SYSTEM_ENTITIES.shipment.primaryDisplayField`), so a
 * shipment with no value there renders nameless, and build plan §9 measured that
 * on 1 of 135 live shipments: every label voided, no replacement bought, no
 * name. A voided number a person can still search beats a nameless row, which is
 * what the field's own doc comment in the registry already promised.
 *
 * What keeps that from reopening the race it sits next to is ORDER, and the
 * order only holds in one of the two sweeps:
 *
 * - The created crawl is `sort_by=created_at`, ASCENDING, so a shipment's labels
 *   reach the sink oldest-first. ShipStation allows one live label per shipment,
 *   so a replacement can only be bought after its predecessor was voided, which
 *   puts the live label LAST and lets its `overwrite` binding land on top.
 * - The VOID sweep is sorted `voided_at` DESCENDING and runs after the created
 *   sweep, so a voided label it re-reads would arrive AFTER the live label that
 *   replaced it and overwrite the shipment's name with a dead number. That is
 *   why `suppressMasterTrackingNumber` exists and why the void sweep sets it:
 *   the void sweep carries void state onto parcels, never a shipment name.
 *
 * The residual risk, recorded rather than hidden: if ShipStation ever permits a
 * second label while the first is live, and the second is then voided, its
 * number would land after the live one within the created sweep. The fix in that
 * case is a second, void-only binding with `mergeStrategy: 'fill_blank'`, not a
 * change here.
 */
export function projectLabelRecord(
  label: RawConnectorLabel,
  options: LabelProjectionOptions = {}
): ConnectorRecord {
  const voided = isLabelVoided(label)
  const voidedAt = label.voided_at ?? null
  const projected = projectLabel(label)

  // `isMaster` is the box with `sequence` 1, never array index 0. The tool-side
  // projection identifies it by tracking-number equality with the label instead;
  // both agreed in the probe's three-box label. Sequence is preferred here
  // because it is the field ShipStation says means "box number", with equality
  // kept as the fallback for a label that carries no sequence at all (a
  // single-box label would otherwise have no master).
  const hasSequenceOne = projected.packages.some((p) => p.sequence === 1)

  const packages = projected.packages.map((p) => {
    if (!p.packageId) {
      // A source-contract error, deliberately loud. Build plan §4: a missing
      // label-package id is not something to paper over with a positional
      // fallback, because position is exactly what the probe disproved. Throwing
      // also leaves the cursor un-advanced, so the page is retried rather than
      // skipped.
      throw new Error(
        `shipstation: label ${label.label_id} has a package with no package_id; ` +
          'refusing to synthesise parcel identity from array position'
      )
    }
    return {
      // `${label_id}:${package_id}`, label-scoped so a void and reprint lands
      // as new parcel rows (history) rather than rewriting the old box.
      packageKey: `${label.label_id}:${p.packageId}`,
      labelId: label.label_id,
      trackingNumber: p.trackingNumber,
      sequence: p.sequence,
      isMaster: hasSequenceOne ? p.sequence === 1 : p.isMaster,
      // Weight is in OUNCES and dimensions in INCHES on this account (1280, 464
      // and 704 oz observed on one label). Nothing is converted; the unit rides
      // alongside every number so the reader converts with the unit in hand.
      weight: p.weight?.value ?? null,
      weightUnit: p.weight?.unit ?? null,
      length: p.dimensions?.length ?? null,
      width: p.dimensions?.width ?? null,
      height: p.dimensions?.height ?? null,
      dimUnit: p.dimensions?.unit ?? null,
      // Void is a LABEL-level fact; ShipStation has no per-box void. Every box on
      // a voided label is voided.
      voided,
      voidedAt,
      // The LABEL's raw `tracking_status`, COPIED DOWN onto every box.
      //
      // It has to be copied because a mapping's `sourcePath` is strictly
      // relative to its `rootPath`, and `joinSourcePath`
      // (packages/lib/src/data-connectors/app-catalog.ts:637) concatenates the
      // two, so a `packages[]` mapping cannot reach a parent-scoped path, and
      // the `providerTrackingStatus` app field is declared on `parcel`. The
      // mapping binds `packages[].providerTrackingStatus`.
      //
      // 🛑 It is the LABEL's value, NOT per-box truth. Probe §3: this label's
      // `tracking_status` was `in_transit` while `/v2/labels/{id}/track`
      // answered `Not Yet In System` for the same label, and VOIDED labels also
      // reported `in_transit`. It is stored unnormalized as provenance, what
      // ShipStation said, and nothing here derives delivery from it.
      providerTrackingStatus: label.tracking_status ?? null,
    }
  })

  // The shipment's DISPLAY NAME, denormalized off the master parcel.
  //
  // `shipment_number` cannot serve: it is not on the label payload at all (it
  // lives on the shipment resource, which is what the `shipment` stream is for),
  // and `computeDisplayValue` reads a field on the shipment ROW, so the number
  // cannot be reached through the parcel relationship either.
  //
  // Free, not an extra request: the master is already identified above. Emitted
  // for a voided label too, from the created sweep only — see the doc comment
  // for why that ordering is what makes it safe, and why the alternative is a
  // nameless shipment.
  const fields: Record<string, unknown> = {
    labelId: label.label_id,
    shipmentId: label.shipment_id ?? null,
    storeId: label.store_id ?? null,
    externalShipmentId: label.external_shipment_id ?? null,
    externalOrderId: label.external_order_id ?? null,
    providerTrackingStatus: label.tracking_status ?? null,
    labelVoided: voided,
    labelVoidedAt: voidedAt,
    packages,
  }

  if (!options.suppressMasterTrackingNumber) {
    fields.masterTrackingNumber =
      packages.find((p) => p.isMaster)?.trackingNumber ?? packages[0]?.trackingNumber ?? null
  }

  if (!voided) {
    fields.shipmentNumber = label.shipment_number ?? null
    fields.carrier = label.carrier_code ?? null
    fields.service = label.service_code ?? null
    fields.shipDate = label.ship_date ?? null
    fields.parcelCount = packages.length
    // The status ladder (status plan §3.1), through the one function that owns
    // it. Every box is offered with a null status, because a ShipStation package
    // has no status field at all, so rung 1 is vacuous here and the LIVE label's
    // `tracking_status` decides. Anything that normalizer does not recognize
    // lands on `label_created`, never on `unknown`.
    fields.shipmentStatus = deriveShipmentStatus(
      packages.map((p) => ({ voided: p.voided, status: null })),
      label.tracking_status
    )

    // Label money and documents (status plan §7). Being inside this block is
    // right on their own terms as well as by the rule above: voiding refunds the
    // label, so the live label's cost is what was actually paid and its PDF is
    // what a person would actually print. The accepted consequence is that a
    // superseded label's PDF becomes unreachable after a void and reprint.
    //
    // 🛑 CURRENCY is INTEGER MINOR UNITS and the wire is a decimal, so these two
    // are multiplied and rounded here. There is no transform hook downstream.
    fields.costMinor = toMinorUnits(label.shipment_cost)
    fields.insuranceCostMinor = toMinorUnits(label.insurance_cost)
    // 🛑 `labelUrl` is a BEARER SECRET. Verified 2026-09-11: the URL fetches
    // UNAUTHENTICATED and the PDF carries the customer's name and address, so
    // the opaque path segment is the only thing protecting it. Never log it,
    // export it, or put it in a webhook payload. `label_download` is an OBJECT
    // (`pdf`, `png`, `zpl`, `href`), so the PDF is read out by name.
    fields.labelUrl = label.label_download?.pdf ?? null
    fields.insuranceClaim = readInsuranceClaim(label.insurance_claim)
  }

  return {
    streamKey: LABEL_STREAM_KEY,
    externalId: label.label_id,
    displayName: label.shipment_number ?? label.label_id,
    fields,
  }
}

/**
 * Project one raw shipment into the source-shaped record the `shipment` mapping
 * reads.
 *
 * 🛑 Three values and no more. `shipment_number` and `store_id` are the reason
 * this stream exists — they live on the shipment resource and are on no label —
 * and `shipmentId` is the identity that lands the record on the same native
 * `shipment` row the label stream already resolves.
 *
 * Everything else the shipment resource offers is deliberately left alone:
 *
 * - `carrier_id`, `service_code`, `ship_date` and `shipment_status` are all
 *   written by the LABEL stream. Two mappings of one connector writing one cell
 *   is the flip-flop the connector's own header warns about, so the two streams'
 *   field sets are kept strictly disjoint.
 * - `external_order_id` stays the LABEL's value. `fields.ts` is explicit that the
 *   app field holds the id "as it appears ON THE LABEL", and probe §2 found the
 *   shipment's own `external_order_id` NULL on the very sample where the label
 *   carried one. Binding it here would overwrite a real value with a null.
 * - `packages[]` is NEVER fanned out from here. The shipment's package
 *   definitions carry distinct `shipment_package_id`s, the SAME `package_id`
 *   (`se-3`) on every row, and no tracking number at all: they are a packaging
 *   TYPE, not a box (probe §2, `fields.ts`). Parcels come from labels, only.
 */
export function projectShipmentRecord(shipment: RawShipment): ConnectorRecord {
  return {
    streamKey: SHIPMENT_STREAM_KEY,
    externalId: shipment.shipment_id,
    displayName: shipment.shipment_number ?? shipment.shipment_id,
    fields: {
      shipmentId: shipment.shipment_id,
      shipmentNumber: shipment.shipment_number ?? null,
      storeId: shipment.store_id ?? null,
    },
  }
}

// ── cursor ───────────────────────────────────────────────────────────────────

/** One half-open crawl window. Both bounds are ISO strings. */
export interface LabelWindow {
  start: string
  end: string
}

/**
 * The steady-phase extension of the label cursor. Absent on a backfill cursor,
 * which is what tells the two phases apart when the cursor is read back.
 */
export interface LabelDeltaState {
  /**
   * Which of the two cursors is in progress. `created` runs first and exhausts
   * `windows`; `voided` then runs the descending sweep, which does not use
   * `windows` at all.
   */
  sweep: 'created' | 'voided'
  /** The floor the new-labels sweep is reading from, this run. */
  createdSince: string
  /** The floor the void sweep stops at, this run. */
  voidedSince: string
}

/**
 * The cursor this stream returns in `nextState.cursor` and reads back from
 * `state.cursor`. Structured rather than a bare token because the crawl has to
 * be able to SUBDIVIDE: `windows[0]` is the window in progress, the rest are
 * waiting, and a window that turns out to hold more rows than the offset ceiling
 * is replaced in place by its two halves.
 *
 * The same shape serves the backfill and the steady delta. `delta` is what
 * distinguishes them, and the window crawl underneath is identical — the delta's
 * new-labels sweep is the backfill crawl with a moving start instead of the
 * fixed `importStart`.
 */
export interface ShipstationLabelCursor {
  /** Window end frozen once per run, so a long crawl has a stable horizon. */
  runEnd: string
  /** Windows still to crawl, in order. Empty means the window crawl is finished. */
  windows: LabelWindow[]
  /** 1-based page within `windows[0]`, or within the void sweep. */
  page: number
  /** Pages fetched so far this run, against `MAX_PAGES_PER_RUN`. */
  pagesFetched: number
  /** Present only in the steady delta. */
  delta?: LabelDeltaState
}

/** The `shipment` stream's cursor. Same window crawl, over `modified_at`. */
export interface ShipstationShipmentCursor {
  runEnd: string
  windows: LabelWindow[]
  page: number
  pagesFetched: number
}

function isWindowCursor(value: unknown): value is ShipstationLabelCursor {
  if (!value || typeof value !== 'object') return false
  const c = value as Partial<ShipstationLabelCursor>
  return (
    typeof c.runEnd === 'string' &&
    Array.isArray(c.windows) &&
    typeof c.page === 'number' &&
    typeof c.pagesFetched === 'number'
  )
}

/**
 * Resolve the configured import start. Thrown rather than defaulted: a silent
 * default would decide how much of the customer's shipping history exists, and
 * a wrong answer there is invisible.
 */
function resolveImportStart(config: ShipstationConnectorConfig): string {
  const raw = config?.importStart
  const ms = typeof raw === 'string' ? Date.parse(raw) : Number.NaN
  if (Number.isNaN(ms)) {
    throw new Error(
      'shipstation: connector config `importStart` is missing or not a parseable date; ' +
        'the label crawl needs a fixed import window start'
    )
  }
  return new Date(ms).toISOString()
}

/** One window from `start` to a frozen `end`, or none when the range is empty. */
function openWindows(start: string, end: string): LabelWindow[] {
  return Date.parse(end) > Date.parse(start) ? [{ start, end }] : []
}

/**
 * Read the BACKFILL cursor back, or open a fresh one. The run's window end is
 * frozen HERE, at the first page, and carried in the cursor for every later
 * page: a window end recomputed per page would drift forward mid-crawl and the
 * crawl would never reach it.
 */
export function readCursor(
  raw: unknown,
  config: ShipstationConnectorConfig
): ShipstationLabelCursor {
  if (isWindowCursor(raw)) return raw
  const start = resolveImportStart(config)
  const end = new Date().toISOString()
  return { runEnd: end, windows: openWindows(start, end), page: 1, pagesFetched: 0 }
}

/**
 * Open a fresh STEADY cursor from the persisted watermark pair.
 *
 * Both halves fall back to `importStart` when the stream has no watermark, which
 * makes a missing or corrupt watermark expensive rather than lossy: the run
 * re-reads the configured history instead of quietly skipping it.
 */
export function openDeltaCursor(
  updatedSince: unknown,
  config: ShipstationConnectorConfig
): ShipstationLabelCursor {
  const importStart = resolveImportStart(config)
  const stored = decodeLabelWatermark(updatedSince)
  const createdSince = stored?.created ?? importStart
  const voidedSince = stored?.voided ?? importStart
  const end = new Date().toISOString()
  return {
    runEnd: end,
    windows: openWindows(createdSince, end),
    page: 1,
    pagesFetched: 0,
    delta: { sweep: 'created', createdSince, voidedSince },
  }
}

/**
 * Decide which phase the LABEL stream is in and hand back the right cursor.
 *
 * 🛑 Not keyed on `args.mode`. The run's mode is connector-wide and reads
 * `snapshot` whenever any stream is still backfilling, including for a stream
 * that is itself long past its own backfill. The state is the honest signal:
 *
 * 1. a stored cursor already says which crawl it belongs to, so continue it;
 * 2. no cursor but a watermark can only mean a backfill that finished, so open
 *    the delta;
 * 3. neither means a first run, or a forced re-backfill (which clears the
 *    watermark), so crawl the whole `importStart` window.
 */
export function readLabelCursor(
  state: { cursor?: unknown; updatedSince?: unknown },
  config: ShipstationConnectorConfig
): ShipstationLabelCursor {
  if (isWindowCursor(state.cursor)) return state.cursor
  if (decodeLabelWatermark(state.updatedSince)) return openDeltaCursor(state.updatedSince, config)
  return readCursor(undefined, config)
}

/** The same phase decision for the `shipment` stream, whose watermark is plain. */
export function readShipmentCursor(
  state: { cursor?: unknown; updatedSince?: unknown },
  config: ShipstationConnectorConfig
): ShipstationShipmentCursor {
  if (isWindowCursor(state.cursor)) return state.cursor as ShipstationShipmentCursor
  const importStart = resolveImportStart(config)
  const since =
    typeof state.updatedSince === 'string' && Number.isFinite(Date.parse(state.updatedSince))
      ? state.updatedSince
      : null
  const end = new Date().toISOString()
  return { runEnd: end, windows: openWindows(since ?? importStart, end), page: 1, pagesFetched: 0 }
}

/**
 * Split a window in two at its midpoint, for a window holding more rows than the
 * offset ceiling can reach. Returns null when the window is already at the
 * `MIN_WINDOW_MS` floor.
 *
 * The halves ABUT (`first.end === second.start`) rather than leaving a gap.
 * Boundary inclusivity is unverified on this API, so an abutting split risks
 * returning a boundary label twice; a gapped split would risk DROPPING it. A
 * duplicate is an idempotent re-upsert, a drop is missing data.
 */
export function subdivideWindow(window: LabelWindow): [LabelWindow, LabelWindow] | null {
  const startMs = Date.parse(window.start)
  const endMs = Date.parse(window.end)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null
  if (endMs - startMs <= MIN_WINDOW_MS) return null
  const mid = new Date(startMs + Math.floor((endMs - startMs) / 2)).toISOString()
  return [
    { start: window.start, end: mid },
    { start: mid, end: window.end },
  ]
}

// ── fetch ────────────────────────────────────────────────────────────────────

/** Is this thrown value the shared client's 429 signal? */
function asRateLimit(err: unknown): RateLimitError | null {
  if (err instanceof RateLimitError) return err
  const code = (err as { code?: unknown } | null)?.code
  return code === 'RATE_LIMIT' ? (err as RateLimitError) : null
}

/**
 * Turn a 429 into the SDK's throttle signal, holding the cursor where it is.
 *
 * Return, never throw and never sleep: the platform pauses the chain and
 * re-enqueues after the wait. The cursor points at the SAME page, so the
 * throttled page is retried rather than skipped, and NO watermark is returned,
 * so neither half of the delta advances past a window that was not read.
 *
 * Only a POSITIVE server hint is passed on. ShipStation sending no `Retry-After`
 * reaches the client as `undefined`, and forwarding a 0 would ask the platform
 * to retry instantly, straight back into the throttle.
 */
function throttled(cursor: unknown, limited: RateLimitError): ConnectorFetchResult {
  return {
    records: [],
    nextState: { cursor },
    rateLimited: {
      retryAfterMs:
        typeof limited.retryAfterSeconds === 'number' && limited.retryAfterSeconds > 0
          ? limited.retryAfterSeconds * 1000
          : undefined,
    },
  }
}

/**
 * Read the API key off the connector's own connection handle.
 *
 * `args.connection` is the connector's ONLY connection handle. Never fall back
 * to the ambient `getConnection()` helper here: that resolves a default account,
 * and a sync that silently picks an account is worse than one that fails.
 */
function requireApiKey(args: ConnectorExecuteArgs<ShipstationConnectorConfig>): string {
  const apiKey = args.connection?.value
  if (!apiKey) throw new Error('shipstation: missing connection (requiresConnection)')
  return apiKey
}

/**
 * Has the whole-run page budget been spent? Loud, not silent: stopping here
 * means the cursor is misbehaving, since the probed account holds 4,290 labels
 * in total against a 100,000-row budget.
 *
 * The caller must return WITHOUT a watermark when this fires. History may be
 * incomplete, and advancing a delta floor over a window that was never read is
 * the one failure this connector cannot detect afterwards.
 */
function pageBudgetSpent(cursor: { pagesFetched: number }, what: string): boolean {
  if (cursor.pagesFetched < MAX_PAGES_PER_RUN) return false
  console.warn(
    `[shipstation] ${what} stopped at the ${MAX_PAGES_PER_RUN}-page budget; ` +
      'history may be incomplete and no watermark is advanced'
  )
  return true
}

/** Where a window-crawl page left the cursor. */
type WindowStep<TRow> =
  | { kind: 'page'; rows: TRow[]; cursor: { windows: LabelWindow[]; page: number } }
  | { kind: 'exhausted'; rows: TRow[] }
  | { kind: 'throttled'; limited: RateLimitError }

/**
 * Fetch ONE page of a window crawl and decide where the cursor goes next.
 *
 * Shared by the label stream (`created_at` windows) and the shipment stream
 * (`modified_at` windows), because the paging, the frozen horizon, the offset
 * ceiling and the subdivision rules are identical and only the query differs.
 *
 * ⚠️ Pagination is decided by the RAW page, never by the projected or filtered
 * one. Both delta sweeps filter locally, and treating an emptied page as the end
 * of the window would silently truncate the crawl.
 */
async function crawlWindowPage<TRow>(opts: {
  apiKey: string
  endpoint: string
  cursor: { windows: LabelWindow[]; page: number }
  query: (window: LabelWindow, page: number) => ShipStationQuery
  readPage: (body: PagedEnvelope) => TRow[]
}): Promise<WindowStep<TRow>> {
  const { apiKey, endpoint, cursor } = opts
  const window = cursor.windows[0]
  if (!window) return { kind: 'exhausted', rows: [] }

  let body: PagedEnvelope
  try {
    body = await shipstationApi<PagedEnvelope>(endpoint, apiKey, opts.query(window, cursor.page))
  } catch (err) {
    const limited = asRateLimit(err)
    if (limited) return { kind: 'throttled', limited }
    // Every other provider error rethrows, which is exactly what PRESERVES the
    // last successful cursor AND both watermarks: nothing advanced is ever
    // returned on a failure. Build plan §2 overrides app-implementation-template
    // v3 here, which recommends advancing polling state on a provider error, and
    // for a reconciliation crawl that would skip the window that failed.
    throw err
  }

  const rows = opts.readPage(body)

  // A window holding more rows than the offset ceiling can reach is SUBDIVIDED
  // rather than abandoned, and rather than paged past a limit the API may refuse.
  // The rows already fetched are still emitted; the sub-windows will re-read
  // them, and a re-upsert of an identical record is free.
  if (cursor.page === 1 && typeof body.total === 'number' && body.total > MAX_OFFSET) {
    const halves = subdivideWindow(window)
    if (halves) {
      return {
        kind: 'page',
        rows,
        cursor: { windows: [halves[0], halves[1], ...cursor.windows.slice(1)], page: 1 },
      }
    }
    console.warn(
      `[shipstation] window ${window.start}..${window.end} reports ${body.total} rows, ` +
        `more than the ${MAX_OFFSET}-row offset ceiling, and is already at the ` +
        `${MIN_WINDOW_MS}ms subdivision floor; this window will be crawled only to the ceiling`
    )
  }

  const totalPages = typeof body.pages === 'number' && body.pages > 0 ? body.pages : undefined
  const lastPage =
    rows.length < PAGE_SIZE ||
    (totalPages !== undefined && cursor.page >= totalPages) ||
    (cursor.page + 1) * PAGE_SIZE > MAX_OFFSET

  const remainingWindows = lastPage ? cursor.windows.slice(1) : cursor.windows
  if (remainingWindows.length === 0) return { kind: 'exhausted', rows }
  return {
    kind: 'page',
    rows,
    cursor: { windows: remainingWindows, page: lastPage ? 1 : cursor.page + 1 },
  }
}

/**
 * The label stream's NEW-LABELS sweep: one page of `/v2/labels` by creation
 * time, ascending, over the window at the head of the cursor.
 *
 * One page per `execute` call: the platform drives the loop, re-invoking with
 * `state.cursor = nextState.cursor` until `backfillComplete`. Exactly one HTTP
 * request is issued per call, which is the whole request budget; there is no
 * inner drain loop to run away.
 */
async function fetchCreatedLabelPage(
  apiKey: string,
  cursor: ShipstationLabelCursor
): Promise<ConnectorFetchResult> {
  const step = await crawlWindowPage<RawConnectorLabel>({
    apiKey,
    endpoint: '/labels',
    cursor,
    readPage: (body) => (body as RawLabelPage).labels ?? [],
    query: (window, page) => ({
      // The crawl is by CREATION time, which is the only label date filter that
      // exists. Voided labels are NOT filtered out: the probe's unfiltered
      // listing returned a voided label among the latest 50, and
      // `label_status=voided` reported 117 of them, so they are in scope here
      // too and their void state is mapped explicitly.
      created_at_start: window.start,
      created_at_end: window.end,
      page,
      page_size: PAGE_SIZE,
      sort_by: 'created_at',
      sort_dir: 'asc',
    }),
  })

  if (step.kind === 'throttled') return throttled(cursor, step.limited)

  const pagesFetched = cursor.pagesFetched + 1

  if (step.kind === 'page') {
    return {
      records: step.rows.map((row) => projectLabelRecord(row)),
      nextState: {
        cursor: { ...cursor, windows: step.cursor.windows, page: step.cursor.page, pagesFetched },
      },
    }
  }

  // The new-labels half is exhausted. In the BACKFILL there is nothing after it,
  // so the run is done and both floors advance to the frozen horizon: every
  // label created in the window was read, and every void applied before the
  // horizon was read with it, since the fetch happens after the horizon is
  // frozen.
  if (!cursor.delta) {
    return {
      records: step.rows.map((row) => projectLabelRecord(row)),
      nextState: {
        cursor: undefined,
        backfillComplete: true,
        updatedSince: encodeLabelWatermark({ created: cursor.runEnd, voided: cursor.runEnd }),
      },
    }
  }

  // In the STEADY delta the void sweep runs next. The created half is proven
  // complete, so its floor advances HERE, on a non-terminal checkpoint — if the
  // void sweep then fails, the created half is not re-read for nothing and the
  // void half has not moved.
  return {
    records: step.rows.map((row) => projectLabelRecord(row)),
    nextState: {
      cursor: {
        ...cursor,
        windows: [],
        page: 1,
        pagesFetched,
        delta: { ...cursor.delta, sweep: 'voided', createdSince: cursor.runEnd },
      },
      updatedSince: encodeLabelWatermark({
        created: cursor.runEnd,
        voided: cursor.delta.voidedSince,
      }),
    },
  }
}

/**
 * The label stream's VOID sweep: one page of `/v2/labels?label_status=voided`,
 * sorted by `voided_at` DESCENDING, stopping at the first label whose `voided_at`
 * is at or before the void watermark.
 *
 * Descending is what makes the stop cheap: the newest voids come first, so the
 * sweep reads only as far back as the watermark and then stops, however large
 * the account's void history is. There is no `voided_at_start` filter to lean on
 * — `created_at_start` / `created_at_end` are the only date filters `/v2/labels`
 * has — so the stop has to be read off the rows.
 *
 * Two rules ride along:
 *
 * - A row with NO parseable `voided_at` does not stop the sweep. Stopping on one
 *   would truncate the sweep on a data quirk and silently drop every older void;
 *   continuing over-reads, which is idempotent.
 * - A label created before `importStart` is SKIPPED, not emitted. The import
 *   start is a floor on what this connector imports at all, and a void sweep is
 *   unbounded in creation time by construction, so without this the delta would
 *   import history the snapshot deliberately excluded.
 */
async function fetchVoidedLabelPage(
  apiKey: string,
  cursor: ShipstationLabelCursor,
  config: ShipstationConnectorConfig
): Promise<ConnectorFetchResult> {
  const delta = cursor.delta
  if (!delta) throw new Error('shipstation: void sweep reached without a delta cursor')

  const importStartMs = Date.parse(resolveImportStart(config))
  const sinceMs = Date.parse(delta.voidedSince)

  let body: RawLabelPage
  try {
    body = await shipstationApi<RawLabelPage>('/labels', apiKey, {
      label_status: 'voided',
      page: cursor.page,
      page_size: PAGE_SIZE,
      sort_by: 'voided_at',
      sort_dir: 'desc',
    })
  } catch (err) {
    const limited = asRateLimit(err)
    if (limited) return throttled(cursor, limited)
    throw err
  }

  const rows = body.labels ?? []
  const records: ConnectorRecord[] = []
  let reachedWatermark = false
  for (const row of rows) {
    const voidedAtMs = row.voided_at ? Date.parse(row.voided_at) : Number.NaN
    if (Number.isFinite(voidedAtMs) && Number.isFinite(sinceMs) && voidedAtMs <= sinceMs) {
      reachedWatermark = true
      break
    }
    const createdAtMs = row.created_at ? Date.parse(row.created_at) : Number.NaN
    if (Number.isFinite(createdAtMs) && createdAtMs < importStartMs) continue
    // 🛑 No master tracking number from this sweep. It runs after the created
    // sweep and is sorted by `voided_at`, so a voided label re-read here arrives
    // AFTER the live label that replaced it and would overwrite the shipment's
    // display name with a dead number. See `LabelProjectionOptions`.
    records.push(projectLabelRecord(row, { suppressMasterTrackingNumber: true }))
  }

  // Pagination from the RAW page, never from `records`: the two local filters
  // above can empty a page that is nonetheless full.
  const totalPages = typeof body.pages === 'number' && body.pages > 0 ? body.pages : undefined
  const lastPage =
    rows.length < PAGE_SIZE ||
    (totalPages !== undefined && cursor.page >= totalPages) ||
    (cursor.page + 1) * PAGE_SIZE > MAX_OFFSET

  const pagesFetched = cursor.pagesFetched + 1

  if (reachedWatermark || lastPage) {
    // Both halves are now proven complete for this run, so both floors advance
    // to the frozen horizon. A void applied after the horizon simply sorts above
    // it next run and is read again; a re-upsert of an identical record is free.
    return {
      records,
      nextState: {
        cursor: undefined,
        backfillComplete: true,
        updatedSince: encodeLabelWatermark({ created: delta.createdSince, voided: cursor.runEnd }),
      },
    }
  }

  return {
    records,
    nextState: { cursor: { ...cursor, page: cursor.page + 1, pagesFetched } },
  }
}

/** Dispatch one page of the `label` stream to whichever cursor is in progress. */
async function fetchLabelPage(
  args: ConnectorExecuteArgs<ShipstationConnectorConfig>
): Promise<ConnectorFetchResult> {
  const apiKey = requireApiKey(args)
  const config = args.config ?? {}
  const cursor = readLabelCursor(args.state ?? {}, config)

  if (pageBudgetSpent(cursor, 'label crawl')) {
    return { records: [], nextState: { cursor: undefined, backfillComplete: true } }
  }

  if (cursor.delta?.sweep === 'voided') return fetchVoidedLabelPage(apiKey, cursor, config)
  if (cursor.windows.length === 0) {
    // No window to crawl. In the backfill that means `importStart` is in the
    // future and nothing has been proven, so no watermark is returned; in the
    // delta it means no new labels since the last run, and the void sweep still
    // has to run.
    if (!cursor.delta) {
      return { records: [], nextState: { cursor: undefined, backfillComplete: true } }
    }
    return {
      records: [],
      nextState: {
        cursor: {
          ...cursor,
          page: 1,
          delta: { ...cursor.delta, sweep: 'voided', createdSince: cursor.runEnd },
        },
        updatedSince: encodeLabelWatermark({
          created: cursor.runEnd,
          voided: cursor.delta.voidedSince,
        }),
      },
    }
  }
  return fetchCreatedLabelPage(apiKey, cursor)
}

/**
 * One page of the `shipment` stream.
 *
 * `GET /v2/shipments` is a GENUINE `modified_at` delta, unlike labels:
 * `modified_at_start` / `modified_at_end` are real filters, `modified_at` is a
 * legal `sort_by`, and it is returned on the shipment object. So this stream
 * needs one cursor, not two.
 *
 * `created_at_start` is sent on every request as well, so the `importStart`
 * floor bounds this stream exactly as it bounds the labels: a shipment created
 * before the configured start never enters, however recently it was touched.
 */
async function fetchShipmentPage(
  args: ConnectorExecuteArgs<ShipstationConnectorConfig>
): Promise<ConnectorFetchResult> {
  const apiKey = requireApiKey(args)
  const config = args.config ?? {}
  const importStart = resolveImportStart(config)
  const cursor = readShipmentCursor(args.state ?? {}, config)

  if (pageBudgetSpent(cursor, 'shipment crawl')) {
    return { records: [], nextState: { cursor: undefined, backfillComplete: true } }
  }
  if (cursor.windows.length === 0) {
    return { records: [], nextState: { cursor: undefined, backfillComplete: true } }
  }

  const step = await crawlWindowPage<RawShipment>({
    apiKey,
    endpoint: '/shipments',
    cursor,
    readPage: (body) => (body as RawShipmentPage).shipments ?? [],
    query: (window, page) => ({
      modified_at_start: window.start,
      modified_at_end: window.end,
      created_at_start: importStart,
      page,
      page_size: PAGE_SIZE,
      sort_by: 'modified_at',
      sort_dir: 'asc',
    }),
  })

  if (step.kind === 'throttled') return throttled(cursor, step.limited)

  const records = step.rows
    .filter((row) => SHIPMENT_STATUSES_WITH_A_LABEL.has(row.shipment_status ?? ''))
    .map(projectShipmentRecord)
  const pagesFetched = cursor.pagesFetched + 1

  if (step.kind === 'exhausted') {
    return {
      records,
      nextState: { cursor: undefined, backfillComplete: true, updatedSince: cursor.runEnd },
    }
  }
  return {
    records,
    nextState: {
      cursor: { ...cursor, windows: step.cursor.windows, page: step.cursor.page, pagesFetched },
    },
  }
}

/**
 * The connector's server handler. Two streams, one page per call.
 *
 * ⚠️ What this does NOT prove, recorded so nobody reads more into it: the probe
 * established that ShipStation ACCEPTS the delta and window queries, not that
 * they capture every change losslessly. Boundary inclusivity, tie handling and
 * pagination stability under concurrent updates are all unverified. The delta is
 * written to be safe under any answer to those — every window start is inclusive
 * and re-reads its boundary, subdivided windows abut rather than gap, and a
 * re-upsert of an identical record is free — but "safe under" is not "verified".
 *
 * V2 webhooks are entirely unverified: `GET /v2/environment/webhooks` returned
 * an empty list and nothing was registered, so there is no webhook steering here
 * and none should be added until the V2 event contract is proved.
 */
export default async function shipstationSync(
  args: ConnectorExecuteArgs<ShipstationConnectorConfig>
): Promise<ConnectorFetchResult> {
  if (args.streamKey === LABEL_STREAM_KEY) return fetchLabelPage(args)
  if (args.streamKey === SHIPMENT_STREAM_KEY) return fetchShipmentPage(args)
  throw new Error(`shipstation: unknown stream "${args.streamKey}"`)
}
