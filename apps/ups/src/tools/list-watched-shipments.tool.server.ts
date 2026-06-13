// src/tools/list-watched-shipments.tool.server.ts

import { computeExpiresAt, listWatches } from './shared/watches'

interface WatchedShipment {
  trackingNumber: string
  recordId: string | null
  lastKnownStatus: string
  watchedAt: string
  expiresAt: string
}

export default async function listWatchedShipments(): Promise<{
  count: number
  shipments: WatchedShipment[]
}> {
  const watches = await listWatches()
  const shipments = watches.map(({ trackingNumber, entry }) => ({
    trackingNumber,
    recordId: entry.recordId ?? null,
    lastKnownStatus: entry.lastKnownStatus,
    watchedAt: entry.watchedAt,
    expiresAt: computeExpiresAt(entry.watchedAt),
  }))
  return { count: shipments.length, shipments }
}
