// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'
import { deleteWebhookHandler, listWebhookHandlers } from '@auxx/sdk/server'
import { TELEGRAM_API } from '../blocks/telegram/shared/telegram-api'

export default async function connectionRemoved({ connection }: { connection: Connection }) {
  const botToken = connection.value

  // 1. Remove webhook from Telegram
  try {
    await fetch(`${TELEGRAM_API}/bot${botToken}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true }),
    })
    console.log('[telegram] Webhook deleted from Telegram')
  } catch (error) {
    // Best-effort — bot token might already be revoked
    console.error('[telegram] Failed to delete Telegram webhook:', error)
  }

  // 2. Clean up webhook handlers scoped to this connection
  const allHandlers = await listWebhookHandlers()
  const connectionHandlers = allHandlers.filter((h) => h.connectionId === connection.id)
  for (const handler of connectionHandlers) {
    await deleteWebhookHandler(handler.id)
  }

  console.log('[telegram] Cleaned up', connectionHandlers.length, 'webhook handlers for connection', connection.id)
}
