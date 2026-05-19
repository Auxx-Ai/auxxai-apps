// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * Supabase has no platform-side resources to clean up on disconnect.
 */
export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // No-op
}
