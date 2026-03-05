// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'
import { deleteWebhookHandler, listWebhookHandlers } from '@auxx/sdk/server'
import { shopifyApi, getShopDomain } from '../blocks/shopify/shared/shopify-api'

export default async function connectionRemoved({ connection }: { connection: Connection }) {
  const token = connection.value
  const shopDomain = getShopDomain(connection.metadata)

  // Unregister webhooks from Shopify (best-effort)
  if (token && shopDomain) {
    const allHandlers = await listWebhookHandlers()
    const connectionHandlers = allHandlers.filter((h) => h.connectionId === connection.id)
    for (const handler of connectionHandlers) {
      const webhookIds = handler.metadata?.webhookIds as string[] | undefined
      if (webhookIds) {
        for (const webhookId of webhookIds) {
          try {
            await shopifyApi(shopDomain, token, `/webhooks/${webhookId}.json`, { method: 'DELETE' })
          } catch {
            // Best-effort — token may already be revoked
          }
        }
      }
    }
  }

  // Delete platform webhook handlers
  const allHandlers = await listWebhookHandlers()
  const connectionHandlers = allHandlers.filter((h) => h.connectionId === connection.id)
  for (const handler of connectionHandlers) {
    await deleteWebhookHandler(handler.id)
  }

  console.log('[shopify] Cleaned up webhook handlers for connection', connection.id)
}
