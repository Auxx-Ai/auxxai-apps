// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * QuickBooks does not support webhooks, so this is a no-op.
 */
export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No-op — QuickBooks has no webhook system
}
