// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'
import {
  deleteWebhookHandler,
  listWebhookHandlers,
  getOrganizationSettings,
} from '@auxx/sdk/server'
import { WHATSAPP_API } from '../blocks/whatsapp/shared/whatsapp-api'

export default async function connectionRemoved({ connection }: { connection: Connection }) {
  const accessToken = connection.value
  const settings = await getOrganizationSettings<{ appId?: string }>()
  const appId = settings?.appId

  // 1. Remove webhook subscription from Meta (best-effort)
  if (appId) {
    try {
      await fetch(`${WHATSAPP_API}/${appId}/subscriptions?object=whatsapp_business_account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      console.log('[whatsapp] Webhook subscription deleted from Meta')
    } catch (error) {
      console.error('[whatsapp] Failed to delete webhook subscription:', error)
    }
  }

  // 2. Clean up webhook handlers scoped to this connection
  const allHandlers = await listWebhookHandlers()
  const connectionHandlers = allHandlers.filter((h) => h.connectionId === connection.id)
  for (const handler of connectionHandlers) {
    await deleteWebhookHandler(handler.id)
  }

  console.log(
    '[whatsapp] Cleaned up',
    connectionHandlers.length,
    'webhook handlers for connection',
    connection.id
  )
}
