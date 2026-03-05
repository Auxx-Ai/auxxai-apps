// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * QuickBooks does not support webhooks, so this is a no-op.
 */
export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // No-op — QuickBooks has no webhook system
}
