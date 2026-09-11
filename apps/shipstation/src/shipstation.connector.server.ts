// src/shipstation.connector.server.ts
//
// Server handler for the single ShipStation data connector. Runs inside the
// app-runtime sandbox and serves ONE stream:
//
//   • `label` → GET /v2/labels over a fixed, configured import window.
//               One record per PURCHASED LABEL, carrying the label's own
//               packages. Contributes into the native hidden `shipment` /
//               `parcel` entities (see shared-shipment-entities-proposal.md).
//
// The stream is `syncMode: 'snapshot'`: build plan §5 rules out a new-labels-only
// watermark because it would never see a VOID applied to an old label, and no
// reliable label modified-time delta has been proved. So each run re-reads the
// configured history plus whatever is new. `orphanBehavior: 'ignore'` belongs on
// every mapping (declared in shipstation.connector.ts): a filtered or partial
// scan is not deletion evidence.
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
// connectors, so `parcel_status` simply stays null and the only status
// information reaching this file is the LABEL-level one. Probe §3 proved that
// value is not evidence of individual delivery:
//
//   • the three-box label reported `tracking_status: 'in_transit'` while
//     `GET /v2/labels/{id}/track` returned `Not Yet In System` (`NY`) with null
//     ship and delivery dates, and
//   • VOIDED labels also reported `tracking_status: 'in_transit'`.
//
// So `shipmentStatus` here is derived from the LABEL LIFECYCLE only: a
// non-voided label is `label_created`, a voided label contributes nothing. The
// label's raw `tracking_status` is still emitted, unnormalized, as
// `providerTrackingStatus` (provenance, so a later reader can see what
// ShipStation actually said), but it is never copied onto every package as if
// it were per-box truth, and it never feeds the roll-up. Preferring `unknown`
// over a value we cannot support is the rule, not a fallback.
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
import { shipstationApi } from './tools/shared/shipstation-api'

/** The one stream this connector serves. */
export const LABEL_STREAM_KEY = 'label'

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
   * This is the connector's ENTIRE config. `shipstation.connector.ts` declares
   * `z.object({ importStart: z.string() })` and nothing else, and in particular no
   * store filter, so nothing is dropped locally today. The pagination below is
   * still driven off the RAW page rather than the projected one, because the day
   * a local filter is added, an emptied page must not read as the end of the
   * crawl.
   */
  importStart?: string
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
 * Normalize ShipStation's own `shipment_status` string into `ShipmentStatus`.
 *
 * The ONLY value the live probe observed is `label_purchased`, which is a
 * label-lifecycle value ("a label exists"), not a transit one. It maps to
 * `label_created`.
 *
 * An ABSENT value is deliberately treated differently from an UNRECOGNIZED one:
 *
 * - absent/blank → `label_created`. We are holding a non-voided label record we
 *   just fetched, so a label demonstrably was created. That is a fact about the
 *   artifact in hand, not an inference about the carrier.
 * - anything else → `unknown`. No second value has ever been observed, so any
 *   other string is a value this app has no evidence for, and rule 2 of §8d says
 *   that becomes `unknown` rather than a guess. When a real second value shows
 *   up in production, add it HERE with the evidence, never from vendor docs.
 */
export function normalizeProviderShipmentStatus(raw: string | null | undefined): ShipmentStatus {
  if (raw === null || raw === undefined || raw === '') return 'label_created'
  switch (raw) {
    case 'label_purchased':
      return 'label_created'
    default:
      return 'unknown'
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

// ── raw payload ──────────────────────────────────────────────────────────────

/**
 * A label as the connector reads it. Extends the tool-side `RawLabel` with the
 * shipment-shaped fields the connector needs and the tools do not.
 *
 * `shipment_number` and `shipment_status` are read off the LABEL when present.
 * The shipment resource is deliberately not fetched: that would be one extra
 * request per label, and probe §2 found the shipment's own `ship_date` and
 * `external_order_id` disagreeing with the label's anyway, so the second call
 * would buy inconsistency rather than detail.
 */
export interface RawConnectorLabel extends RawLabel {
  shipment_number?: string | null
  shipment_status?: string | null
  store_id?: string | null
  external_shipment_id?: string | null
}

/** The `/v2/labels` list envelope. */
interface RawLabelPage {
  labels?: RawConnectorLabel[]
  total?: number
  page?: number
  pages?: number
}

/**
 * Is this label voided?
 *
 * `voided` is the boolean the payload carries. `label_status` is also checked
 * because probe §3 found it null on live list and get responses, so it cannot be
 * relied on alone, but when it DOES say `voided`, believe it. Reading both in
 * the permissive direction errs toward excluding a box from active tracking,
 * which is the safe direction: a wrongly-active voided box would be reported to
 * a customer as in transit.
 */
export function isLabelVoided(label: RawConnectorLabel): boolean {
  return Boolean(label.voided) || label.label_status === 'voided'
}

// ── projection ───────────────────────────────────────────────────────────────

/**
 * Project one raw label into the source-shaped record the mappings read.
 *
 * Package identity, sequencing and master detection are delegated to
 * `projectLabel` (the tool-side projection), which already encodes the probe's
 * two hard-won facts: ids stay STRINGS (`se-*` is never coerced to a number) and
 * display order comes from `sequence`, never array position: in the observed
 * three-box label the master was returned LAST.
 *
 * 🛑 Structural shipment fields (`shipmentNumber`, `carrier`, `service`,
 * `shipDate`, `parcelCount`, `shipmentStatus`) are emitted ONLY for a non-voided
 * label. This is load-bearing, not hygiene.
 *
 * Probe §3 found one shipment carrying two labels, one voided and one active,
 * both sharing the shipment id, so both records map onto the SAME shipment row.
 * When both land in one slice the entity sink runs a slice dedupe
 * (`entity-sink.ts:1055`) in which the FIRST record wins the writes and the
 * second is recorded as `lostSliceDedupe`. Which of the two wins depends on page
 * order, so without this filter the shipment's carrier, service, ship date and
 * status would be non-deterministic from run to run, sometimes the live
 * label's, sometimes a voided label's. Emitting them from the live label only
 * removes the race instead of hoping to win it.
 *
 * The voided label's parcels are still emitted, flagged `voided: true`, because
 * the void history is the point.
 */
export function projectLabelRecord(label: RawConnectorLabel): ConnectorRecord {
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

  if (!voided) {
    fields.shipmentNumber = label.shipment_number ?? null
    fields.carrier = label.carrier_code ?? null
    fields.service = label.service_code ?? null
    fields.shipDate = label.ship_date ?? null
    fields.parcelCount = packages.length
    // Every active box of a live label shares the label's lifecycle status,
    // because that is the only status this app has any evidence for. The roll-up
    // is still routed through `rollUpShipmentStatus` so the shipment's value is
    // produced by ONE rule, ready for the day a carrier app writes real per-box
    // status and the boxes start to disagree.
    const parcelStatus = normalizeProviderShipmentStatus(label.shipment_status)
    fields.shipmentStatus = rollUpShipmentStatus(
      packages.map((p) => ({ voided: p.voided, status: parcelStatus }))
    )
    // The shipment's DISPLAY NAME, denormalized off the master parcel.
    //
    // `shipment_number` cannot serve: it is not on the label payload at all (it
    // lives on the shipment resource), so binding it alone leaves every shipment
    // nameless. And `computeDisplayValue` reads a field on the shipment ROW, so
    // the number cannot be reached through the parcel relationship either - it
    // has to be copied here.
    //
    // Free, not an extra request: the master is already identified above. This
    // whole branch is skipped for a voided label, so an active label's master
    // always wins over a voided one's; a shipment whose every label is voided
    // keeps the voided master, which beats a nameless row.
    fields.masterTrackingNumber =
      packages.find((p) => p.isMaster)?.trackingNumber ?? packages[0]?.trackingNumber ?? null
  }

  return {
    streamKey: LABEL_STREAM_KEY,
    externalId: label.label_id,
    displayName: label.shipment_number ?? label.label_id,
    fields,
  }
}

// ── cursor ───────────────────────────────────────────────────────────────────

/** One half-open crawl window. Both bounds are ISO strings. */
export interface LabelWindow {
  start: string
  end: string
}

/**
 * The cursor this stream returns in `nextState.cursor` and reads back from
 * `state.cursor`. Structured rather than a bare token because the crawl has to
 * be able to SUBDIVIDE: `windows[0]` is the window in progress, the rest are
 * waiting, and a window that turns out to hold more rows than the offset ceiling
 * is replaced in place by its two halves.
 */
export interface ShipstationLabelCursor {
  /** Window end frozen once per run, so a long crawl has a stable horizon. */
  runEnd: string
  /** Windows still to crawl, in order. Empty means the crawl is finished. */
  windows: LabelWindow[]
  /** 1-based page within `windows[0]`. */
  page: number
  /** Pages fetched so far this run, against `MAX_PAGES_PER_RUN`. */
  pagesFetched: number
}

function isLabelCursor(value: unknown): value is ShipstationLabelCursor {
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

/**
 * Read the cursor back, or open a fresh one. The run's window end is frozen
 * HERE, at the first page, and carried in the cursor for every later page: a
 * window end recomputed per page would drift forward mid-crawl and the crawl
 * would never reach it.
 */
export function readCursor(
  raw: unknown,
  config: ShipstationConnectorConfig
): ShipstationLabelCursor {
  if (isLabelCursor(raw)) return raw
  const start = resolveImportStart(config)
  const end = new Date().toISOString()
  const windows = Date.parse(end) > Date.parse(start) ? [{ start, end }] : []
  return { runEnd: end, windows, page: 1, pagesFetched: 0 }
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
 * Fetch ONE page of `/v2/labels` for the window at the head of the cursor.
 *
 * One page per `execute` call: the platform drives the loop, re-invoking with
 * `state.cursor = nextState.cursor` until `backfillComplete`. Exactly one HTTP
 * request is issued per call, which is the whole request budget; there is no
 * inner drain loop to run away.
 */
async function fetchLabelPage(
  args: ConnectorExecuteArgs<ShipstationConnectorConfig>
): Promise<ConnectorFetchResult> {
  const apiKey = args.connection?.value
  if (!apiKey) {
    // `args.connection` is the connector's ONLY connection handle. Never fall
    // back to the ambient `getConnection()` helper here: that resolves a default
    // account, and a sync that silently picks an account is worse than one that
    // fails.
    throw new Error('shipstation: missing connection (requiresConnection)')
  }

  const cursor = readCursor(args.state.cursor, args.config ?? {})
  const window = cursor.windows[0]
  if (!window) {
    return { records: [], nextState: { cursor: undefined, backfillComplete: true } }
  }
  if (cursor.pagesFetched >= MAX_PAGES_PER_RUN) {
    // Loud, not silent: stopping here means the cursor is misbehaving, since the
    // probed account holds 4,290 labels in total against a 100,000-row budget.
    console.warn(
      `[shipstation] label crawl stopped at the ${MAX_PAGES_PER_RUN}-page budget with ` +
        `${cursor.windows.length} window(s) unfinished; history may be incomplete`
    )
    return { records: [], nextState: { cursor: undefined, backfillComplete: true } }
  }

  let page: RawLabelPage
  try {
    page = await shipstationApi<RawLabelPage>('/labels', apiKey, {
      // The crawl is by CREATION time, which is the only label filter proved to
      // work. Voided labels are NOT filtered out: the probe's unfiltered listing
      // returned a voided label among the latest 50, and `label_status=voided`
      // reported 117 of them, so they are in scope and their void state is
      // mapped explicitly.
      created_at_start: window.start,
      created_at_end: window.end,
      page: cursor.page,
      page_size: PAGE_SIZE,
      sort_by: 'created_at',
      sort_dir: 'asc',
    })
  } catch (err) {
    const limited = asRateLimit(err)
    if (limited) {
      // Return, never throw and never sleep: the platform pauses the chain and
      // re-enqueues after the wait. The cursor points at the SAME page, so the
      // throttled page is retried rather than skipped.
      return {
        records: [],
        nextState: { cursor },
        rateLimited: {
          // Only a POSITIVE server hint is passed on. ShipStation sending no
          // `Retry-After` reaches the client as 0, and forwarding a 0 would ask
          // the platform to retry instantly, straight back into the throttle.
          // Omitting it lets the platform apply its own backoff.
          retryAfterMs:
            typeof limited.retryAfterSeconds === 'number' && limited.retryAfterSeconds > 0
              ? limited.retryAfterSeconds * 1000
              : undefined,
        },
      }
    }
    // Every other provider error rethrows, which is exactly what PRESERVES the
    // last successful cursor: nothing advanced is ever returned on a failure.
    // Build plan §2 overrides app-implementation-template v3 here, which
    // recommends advancing polling state on a provider error, and for a
    // reconciliation crawl that would skip the window that failed.
    throw err
  }

  const rows = page.labels ?? []
  const nextPagesFetched = cursor.pagesFetched + 1

  // A window holding more rows than the offset ceiling can reach is SUBDIVIDED
  // rather than abandoned, and rather than paged past a limit the API may refuse.
  // The rows already fetched are still emitted; the sub-windows will re-read
  // them, and a re-upsert of an identical record is free.
  if (cursor.page === 1 && typeof page.total === 'number' && page.total > MAX_OFFSET) {
    const halves = subdivideWindow(window)
    if (halves) {
      return {
        records: rows.map(projectLabelRecord),
        nextState: {
          cursor: {
            ...cursor,
            windows: [halves[0], halves[1], ...cursor.windows.slice(1)],
            page: 1,
            pagesFetched: nextPagesFetched,
          },
        },
      }
    }
    console.warn(
      `[shipstation] window ${window.start}..${window.end} reports ${page.total} labels, ` +
        `more than the ${MAX_OFFSET}-row offset ceiling, and is already at the ` +
        `${MIN_WINDOW_MS}ms subdivision floor; this window will be crawled only to the ceiling`
    )
  }

  // Pagination is decided by the RAW page, never by the projected/emitted one.
  // No local filter is declared today, but if one is ever added, a page filtered
  // away entirely is still a full page, and treating an empty projected page as
  // the end of the window would silently truncate the crawl.
  const totalPages = typeof page.pages === 'number' && page.pages > 0 ? page.pages : undefined
  const lastPage =
    rows.length < PAGE_SIZE ||
    (totalPages !== undefined && cursor.page >= totalPages) ||
    (cursor.page + 1) * PAGE_SIZE > MAX_OFFSET

  const remainingWindows = lastPage ? cursor.windows.slice(1) : cursor.windows
  const done = remainingWindows.length === 0

  return {
    records: rows.map(projectLabelRecord),
    nextState: done
      ? { cursor: undefined, backfillComplete: true }
      : {
          cursor: {
            ...cursor,
            windows: remainingWindows,
            page: lastPage ? 1 : cursor.page + 1,
            pagesFetched: nextPagesFetched,
          },
        },
  }
}

/**
 * The connector's server handler. One stream, one page per call.
 *
 * ⚠️ What this does NOT prove, recorded so nobody reads more into it: the probe
 * established that ShipStation ACCEPTS the delta and window queries, not that
 * they capture every change losslessly. Boundary inclusivity, tie handling and
 * pagination stability under concurrent updates are all unverified, which is
 * precisely why this stream is a re-reading snapshot rather than a watermark.
 * V2 webhooks are entirely unverified: `GET /v2/environment/webhooks` returned
 * an empty list and nothing was registered, so there is no webhook steering
 * here and none should be added until the V2 event contract is proved.
 */
export default async function shipstationSync(
  args: ConnectorExecuteArgs<ShipstationConnectorConfig>
): Promise<ConnectorFetchResult> {
  if (args.streamKey !== LABEL_STREAM_KEY) {
    throw new Error(`shipstation: unknown stream "${args.streamKey}"`)
  }
  return fetchLabelPage(args)
}
