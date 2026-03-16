// src/events/connection-removed.event.ts

import { listWebhookHandlers, deleteWebhookHandler } from '@auxx/sdk/server'
import type { Connection } from '@auxx/sdk/server'

/**
 * Called when a Slack connection is removed.
 * Cleans up all registered webhook handlers.
 */
export default async function connectionRemoved({ connection }: { connection: Connection }) {
  const webhookHandlers = await listWebhookHandlers()

  for (const webhookHandler of webhookHandlers) {
    await deleteWebhookHandler(webhookHandler.id)
  }
}
