// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * Supabase does not require any connection-time setup beyond storing the
 * Service Role key. Realtime triggers are deferred — see §13 of the
 * implementation plan.
 */
export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No-op
}
