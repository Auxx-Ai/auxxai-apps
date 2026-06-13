// src/triggers/shipment-status-changed/shipment-status-changed.server.ts

/**
 * Polling execute for `ups.shipment-status-changed`.
 *
 * Two load-bearing pieces of state, deliberately split:
 *  - Watch MEMBERSHIP lives in the shared KV collection (written by tools).
 *  - Last-seen status for DIFFING lives in per-instance polling state, so two
 *    agents enabling this trigger each observe every transition (a shared diff
 *    source would let the first instance consume the change and starve the rest).
 *
 * Provider errors never throw out of the execute — a failing UPS morning must
 * not kill the schedule. Each number is looked up in isolation
 * (`trackNumbersSettled`); a number that errors keeps its prior diff state.
 */

import type { PollingExecuteResult, PollingState } from '@auxx/sdk/server'
import { mapShipment } from '../../tools/shared/map-shipment'
import { trackNumbersSettled } from '../../tools/shared/ups-api'
import type { MappedShipment } from '../../tools/shared/shipment-schema'
import { listWatches, removeWatch, updateWatch, type WatchEntry } from '../../tools/shared/watches'

const TERMINAL: ReadonlyArray<MappedShipment['statusType']> = ['delivered', 'returned_to_shipper']

interface TriggerInput {
  statusTypes?: string[]
}

interface TriggerState {
  lastStatusByNumber?: Record<string, string>
}

function buildEvent(
  shipment: MappedShipment,
  previousStatus: string,
  entry: WatchEntry
): Record<string, unknown> {
  return {
    eventId: `ups-${shipment.trackingNumber}-${shipment.statusType}-${shipment.lastActivity?.date ?? ''}`,
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

  const results = await trackNumbersSettled(watches.map((w) => w.trackingNumber))

  const events: Record<string, unknown>[] = []
  // Rebuilt fresh each poll so unwatched/expired numbers drop out — no unbounded growth.
  const nextStatusByNumber: Record<string, string> = {}

  for (const result of results) {
    const { trackingNumber } = result
    const entry = entryByNumber.get(trackingNumber)
    if (!entry) continue

    const prev = lastStatusByNumber[trackingNumber]

    // Errored or not-found: keep watching, preserve prior status for the next diff.
    const { found, shipment } = result.error
      ? { found: false, shipment: null }
      : mapShipment(trackingNumber, result.pkg)
    if (!found || !shipment) {
      if (prev !== undefined) nextStatusByNumber[trackingNumber] = prev
      continue
    }

    const current = shipment.statusType

    // First sighting → seed silently (miss rather than re-process on enable).
    const changed = prev !== undefined && prev !== current
    if (changed && (statusFilter.size === 0 || statusFilter.has(current))) {
      events.push(buildEvent(shipment, prev, entry))
    }

    if (TERMINAL.includes(current)) {
      // Final state — emit (above) then stop watching. Drop from next state.
      await removeWatch(trackingNumber)
    } else {
      nextStatusByNumber[trackingNumber] = current
      if (prev !== current) {
        await updateWatch(trackingNumber, { ...entry, lastKnownStatus: current })
      }
    }
  }

  return { events, state: { lastStatusByNumber: nextStatusByNumber } }
}
