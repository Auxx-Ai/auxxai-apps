// src/triggers/shipment-tracker/shipment-tracker.server.ts

/**
 * Polling execute for `ups.shipment-tracker` — the workflow-native UPS trigger.
 *
 * Self-configured: its source of truth is the panel (tracking numbers), not the
 * watch-registry KV collection. Last-seen status for diffing lives in the
 * trigger's own polling state, so two workflows using this trigger each observe
 * every transition independently.
 *
 * A `terminal` skip-set keeps delivered / returned shipments from burning API
 * calls forever — important here because the configured list is static and never
 * gets unwatched. Provider errors never throw out of the execute: each number is
 * looked up in isolation via `trackNumbersSettled`, so one failing number never
 * kills the schedule.
 */

import type { PollingExecuteResult, PollingState } from '@auxx/sdk/server'
import { mapShipment } from '../../tools/shared/map-shipment'
import { trackNumbersSettled } from '../../tools/shared/ups-api'
import type { MappedShipment } from '../../tools/shared/shipment-schema'

const TERMINAL: ReadonlyArray<MappedShipment['statusType']> = ['delivered', 'returned_to_shipper']

interface TriggerInput {
  trackingNumbers?: string
  statusTypes?: string[]
}

interface TriggerState {
  lastStatusByNumber?: Record<string, string>
  terminal?: string[]
}

/** Split a comma/whitespace-separated string into deduped, trimmed tracking numbers. */
function parseNumbers(raw: string | undefined): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  for (const part of raw.split(/[\s,]+/)) {
    const n = part.trim()
    if (n) seen.add(n)
  }
  return [...seen]
}

function buildEvent(shipment: MappedShipment, previousStatus: string): Record<string, unknown> {
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

  // Resolve the configured number set, minus anything already in a terminal
  // state (it won't change again).
  const configured = parseNumbers(input.trackingNumbers).filter((n) => !terminal.has(n))

  if (!configured.length) {
    return { events: [], state: { lastStatusByNumber: {}, terminal: [...terminal] } }
  }

  const statusFilter = new Set(input.statusTypes ?? [])
  const events: Record<string, unknown>[] = []
  // Rebuilt fresh each poll so removed numbers drop out — no unbounded growth.
  const nextStatusByNumber: Record<string, string> = {}

  const results = await trackNumbersSettled(configured)

  for (const result of results) {
    const { trackingNumber } = result
    const prev = lastStatusByNumber[trackingNumber]

    // Errored or not-found: keep tracking, preserve prior status for the next diff.
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
      events.push(buildEvent(shipment, prev))
    }

    if (TERMINAL.includes(current)) {
      // Final state — emit (above), then stop tracking it on future polls.
      terminal.add(trackingNumber)
    } else {
      nextStatusByNumber[trackingNumber] = current
    }
  }

  return { events, state: { lastStatusByNumber: nextStatusByNumber, terminal: [...terminal] } }
}
