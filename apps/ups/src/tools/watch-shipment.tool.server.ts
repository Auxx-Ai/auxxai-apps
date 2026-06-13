// src/tools/watch-shipment.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { mapShipment } from './shared/map-shipment'
import { trackNumbers } from './shared/ups-api'
import { addWatch, computeExpiresAt } from './shared/watches'
import type { ShipmentStatusType } from './shared/shipment-schema'

interface WatchShipmentInput {
  trackingNumber: string
  recordId?: string
}

interface WatchShipmentOutput {
  watched: boolean
  currentStatus: ShipmentStatusType
  expiresAt: string
}

export default async function watchShipment(
  input: WatchShipmentInput
): Promise<WatchShipmentOutput> {
  const { trackingNumber, recordId } = input

  // Track first: validates the number and gives the agent current status now.
  const [result] = await trackNumbers([trackingNumber])
  const { found, shipment } = mapShipment(trackingNumber, result?.pkg ?? null)
  if (!found || !shipment) {
    throw new InvalidInputError(
      `UPS has no information for tracking number ${trackingNumber} — it can't be watched yet.`
    )
  }

  const watchedAt = new Date().toISOString()
  await addWatch(trackingNumber, {
    ...(recordId ? { recordId } : {}),
    watchedAt,
    lastKnownStatus: shipment.statusType,
  })

  return {
    watched: true,
    currentStatus: shipment.statusType,
    expiresAt: computeExpiresAt(watchedAt),
  }
}
