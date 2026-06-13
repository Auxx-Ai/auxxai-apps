// src/triggers/shipment-status-changed/shipment-status-changed.server.ts

/**
 * Polling execute for `fedex.shipment-status-changed`.
 *
 * Two load-bearing pieces of state, deliberately split:
 *  - Watch MEMBERSHIP lives in the shared KV collection (written by tools).
 *  - Last-seen status for DIFFING lives in per-instance polling state, so two
 *    agents enabling this trigger each observe every transition (a shared diff
 *    source would let the first instance consume the change and starve the rest).
 *
 * Provider errors never throw out of the execute — a failing FedEx morning must
 * not kill the schedule. API calls are chunked and each chunk is isolated.
 */

import type { PollingExecuteResult, PollingState } from '@auxx/sdk/server'
import { trackByNumbers } from '../../tools/shared/fedex-api'
import { mapShipment } from '../../tools/shared/map-shipment'
import type { MappedShipment } from '../../tools/shared/shipment-schema'
import { listWatches, removeWatch, updateWatch, type WatchEntry } from '../../tools/shared/watches'

const CHUNK_SIZE = 30
const TERMINAL: ReadonlyArray<MappedShipment['statusType']> = ['delivered', 'returned_to_shipper']

interface TriggerInput {
  statusTypes?: string[]
}

interface TriggerState {
  lastStatusByNumber?: Record<string, string>
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function buildEvent(
  shipment: MappedShipment,
  previousStatus: string,
  entry: WatchEntry
): Record<string, unknown> {
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
    recordId: entry.recordId ?? '',
  }
}

export default async function shipmentStatusChangedExecute(
  input: TriggerInput,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const prevState = (polling.state as TriggerState) ?? {}
  const lastStatusByNumber = prevState.lastStatusByNumber ?? {}

  const watches = await listWatches()
  if (!watches.length) {
    return { events: [], state: { lastStatusByNumber: {} } }
  }

  const statusFilter = new Set(input.statusTypes ?? [])
  const entryByNumber = new Map(watches.map((w) => [w.trackingNumber, w.entry]))

  const events: Record<string, unknown>[] = []
  // Rebuilt fresh each poll so unwatched/expired numbers drop out — no unbounded growth.
  const nextStatusByNumber: Record<string, string> = {}

  for (const group of chunk(watches, CHUNK_SIZE)) {
    let numberResults: Awaited<ReturnType<typeof trackByNumbers>>
    try {
      numberResults = await trackByNumbers(
        group.map((w) => ({ trackingNumberInfo: { trackingNumber: w.trackingNumber } }))
      )
    } catch {
      // Failed chunk: leave its entries' state untouched so they diff next poll.
      for (const w of group) {
        const prev = lastStatusByNumber[w.trackingNumber]
        if (prev !== undefined) nextStatusByNumber[w.trackingNumber] = prev
      }
      continue
    }

    for (const { trackingNumber, trackResults } of numberResults) {
      const entry = entryByNumber.get(trackingNumber)
      if (!entry) continue
      const { found, shipment } = mapShipment(trackingNumber, trackResults)
      if (!found || !shipment) {
        // Keep watching; preserve prior status for the next diff.
        const prev = lastStatusByNumber[trackingNumber]
        if (prev !== undefined) nextStatusByNumber[trackingNumber] = prev
        continue
      }

      const current = shipment.statusType
      const prev = lastStatusByNumber[trackingNumber]

      // First sighting → seed silently (miss rather than re-process on enable).
      const changed = prev !== undefined && prev !== current
      if (changed && (statusFilter.size === 0 || statusFilter.has(current))) {
        events.push(buildEvent(shipment, prev, entry))
      }

      if (TERMINAL.includes(current)) {
        // Final state — emit (above) then stop watching.
        await removeWatch(trackingNumber)
        // Drop from next state; the registry no longer holds it.
      } else {
        nextStatusByNumber[trackingNumber] = current
        if (prev !== current) {
          await updateWatch(trackingNumber, { ...entry, lastKnownStatus: current })
        }
      }
    }
  }

  return { events, state: { lastStatusByNumber: nextStatusByNumber } }
}
