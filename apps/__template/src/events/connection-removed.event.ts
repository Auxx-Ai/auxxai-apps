// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * Airtable does not support webhooks, so this is a no-op.
 */
export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // No-op — Airtable has no webhook system
}
