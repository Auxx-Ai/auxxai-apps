// src/tools/shared/watches.ts

/**
 * Watch registry — one KV row per watched tracking number, connection-scoped so
 * each FedEx account keeps its own list. Written by the watch/unwatch tools,
 * read + updated by the polling trigger. Row-per-entry means a tool write and a
 * trigger poll never race on a shared blob.
 *
 * TTL doubles as a 30-day watch expiry (FedEx retains tracking data ~90 days
 * post-delivery; 30 covers long-haul + returns with margin). KV expires entries
 * automatically — no manual pruning of stale rows.
 */

import { InvalidInputError, storage } from '@auxx/sdk/server'

export interface WatchEntry {
  /** Auxx ticket record id to link the shipment to — echoed in change events. */
  recordId?: string
  /** UTC ISO when the watch was created or last refreshed. */
  watchedAt: string
  /** Last normalized status the trigger recorded for this number. */
  lastKnownStatus: string
}

export const WATCH_TTL_SECONDS = 30 * 86400
/** Per-connection cap. Batching means 100 watches cost only 4 API calls/poll. */
export const MAX_WATCHES = 100

const COLLECTION = 'watch'

function watchCollection() {
  return storage.collection(COLLECTION, { scope: 'connection' })
}

/** Expiry timestamp derived from `watchedAt` + the TTL (UTC ISO). */
export function computeExpiresAt(watchedAt: string): string {
  return new Date(Date.parse(watchedAt) + WATCH_TTL_SECONDS * 1000).toISOString()
}

export async function listWatches(): Promise<Array<{ trackingNumber: string; entry: WatchEntry }>> {
  const { entries } = await watchCollection().list<WatchEntry>()
  return entries.map((e) => ({ trackingNumber: e.key, entry: e.value }))
}

/**
 * Upsert a watch entry. Re-watching refreshes the TTL. Enforces {@link MAX_WATCHES}
 * for new entries — over cap throws so the agent can unwatch or wait for expiry.
 */
export async function addWatch(trackingNumber: string, entry: WatchEntry): Promise<void> {
  const { entries } = await watchCollection().list<WatchEntry>()
  const exists = entries.some((e) => e.key === trackingNumber)
  if (!exists && entries.length >= MAX_WATCHES) {
    throw new InvalidInputError(
      `FedEx watch limit reached (${MAX_WATCHES}). Unwatch a shipment or wait for one to expire before adding more.`
    )
  }
  await watchCollection().set(trackingNumber, entry, { ttlSeconds: WATCH_TTL_SECONDS })
}

/** Persist an updated entry without changing membership (status diff updates). */
export async function updateWatch(trackingNumber: string, entry: WatchEntry): Promise<void> {
  await watchCollection().set(trackingNumber, entry, { ttlSeconds: WATCH_TTL_SECONDS })
}

/** Remove a watch. Returns whether it existed (false is not an error). */
export async function removeWatch(trackingNumber: string): Promise<boolean> {
  const existing = await watchCollection().get<WatchEntry>(trackingNumber)
  await watchCollection().remove(trackingNumber)
  return existing != null
}
