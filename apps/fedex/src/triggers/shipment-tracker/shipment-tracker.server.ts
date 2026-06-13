// src/triggers/shipment-tracker/shipment-tracker.server.ts

/**
 * Polling execute for `fedex.shipment-tracker` — the workflow-native FedEx
 * trigger.
 *
 * Self-configured: its source of truth is the panel (tracking numbers and/or a
 * reference), not the watch-registry KV collection. Last-seen status for diffing
 * lives in the trigger's own polling state, so two workflows using this trigger
 * each observe every transition independently.
 *
 * A `terminal` skip-set keeps delivered / returned shipments from burning API
 * calls forever — important here because the configured list is static and never
 * gets unwatched. Provider errors never throw out of the execute.
 */

import type { PollingExecuteResult, PollingState } from '@auxx/sdk/server'
import { trackByNumbers, trackByReference } from '../../tools/shared/fedex-api'
import { mapShipment } from '../../tools/shared/map-shipment'
import { getFedexCredentials } from '../../tools/shared/connection'
import type { MappedShipment } from '../../tools/shared/shipment-schema'

const CHUNK_SIZE = 30
const TERMINAL: ReadonlyArray<MappedShipment['statusType']> = ['delivered', 'returned_to_shipper']

interface TriggerInput {
  trackingNumbers?: string
  reference?: string
  referenceType?: string
  statusTypes?: string[]
}

interface TriggerState {
  lastStatusByNumber?: Record<string, string>
  terminal?: string[]
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** Split a comma/newline-separated string into deduped, trimmed tracking numbers. */
function parseNumbers(raw: string | undefined): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  for (const part of raw.split(/[\s,]+/)) {
    const n = part.trim()
    if (n) seen.add(n)
  }
  return [...seen]
}

/** YYYY-MM-DD for a Date. */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Resolve the reference (if any) to its current tracking numbers; never throws. */
async function resolveReference(input: TriggerInput): Promise<string[]> {
  if (!input.reference) return []
  try {
    const { accountNumber } = getFedexCredentials()
    if (!accountNumber) return []
    const now = new Date()
    const results = await trackByReference({
      reference: input.reference,
      referenceType: input.referenceType ?? 'CUSTOMER_REFERENCE',
      accountNumber,
      shipDateBegin: isoDate(new Date(now.getTime() - 30 * 86400 * 1000)),
      shipDateEnd: isoDate(now),
    })
    return results.map((r) => r.trackingNumber).filter(Boolean)
  } catch {
    return []
  }
}

function buildEvent(shipment: MappedShipment, previousStatus: string): Record<string, unknown> {
  return {
    eventId: `fedex-${shipment.trackingNumber}-${shipment.statusType}-${shipment.lastActivity?.date ?? ''}`,
    trackingNumber: shipment.trackingNumber,
    previousStatus,
    status: shipment.statusType,
    statusCode: shipment.statusCode,
    statusDescription: shipment.statusDescription,
    location: shipment.lastActivity?.location ?? '',
    estimatedDelivery: shipment.estimatedDelivery ?? '',
    deliveredAt: shipment.deliveredAt ?? '',
    isDelivered: shipment.statusType === 'delivered',
    isException: shipment.statusType === 'exception',
    isDelayed: shipment.isDelayed,
    recordId: '',
  }
}

export default async function shipmentTrackerExecute(
  input: TriggerInput,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const prevState = (polling.state as TriggerState) ?? {}
  const lastStatusByNumber = prevState.lastStatusByNumber ?? {}
  const terminal = new Set(prevState.terminal ?? [])

  // Resolve the configured number set: explicit list + reference expansion,
  // minus anything already in a terminal state (it won't change again).
  const explicit = parseNumbers(input.trackingNumbers)
  const fromRef = await resolveReference(input)
  const configured = [...new Set([...explicit, ...fromRef])].filter((n) => !terminal.has(n))

  if (!configured.length) {
    return { events: [], state: { lastStatusByNumber: {}, terminal: [...terminal] } }
  }

  const statusFilter = new Set(input.statusTypes ?? [])
  const events: Record<string, unknown>[] = []
  // Rebuilt fresh each poll so removed numbers drop out — no unbounded growth.
  const nextStatusByNumber: Record<string, string> = {}

  for (const group of chunk(configured, CHUNK_SIZE)) {
    let numberResults: Awaited<ReturnType<typeof trackByNumbers>>
    try {
      numberResults = await trackByNumbers(
        group.map((trackingNumber) => ({ trackingNumberInfo: { trackingNumber } }))
      )
    } catch {
      // Failed chunk: preserve prior status so these numbers diff next poll.
      for (const n of group) {
        const prev = lastStatusByNumber[n]
        if (prev !== undefined) nextStatusByNumber[n] = prev
      }
      continue
    }

    const byNumber = new Map(numberResults.map((r) => [r.trackingNumber, r.trackResults]))
    for (const trackingNumber of group) {
      const { found, shipment } = mapShipment(trackingNumber, byNumber.get(trackingNumber) ?? [])
      if (!found || !shipment) {
        const prev = lastStatusByNumber[trackingNumber]
        if (prev !== undefined) nextStatusByNumber[trackingNumber] = prev
        continue
      }

      const current = shipment.statusType
      const prev = lastStatusByNumber[trackingNumber]

      // First sighting → seed silently (miss rather than re-process on enable).
      const changed = prev !== undefined && prev !== current
      if (changed && (statusFilter.size === 0 || statusFilter.has(current))) {
        events.push(buildEvent(shipment, prev))
      }

      if (TERMINAL.includes(current)) {
        // Final state — emit (above), then stop tracking it on future polls.
        terminal.add(trackingNumber)
      } else {
        nextStatusByNumber[trackingNumber] = current
      }
    }
  }

  return { events, state: { lastStatusByNumber: nextStatusByNumber, terminal: [...terminal] } }
}
