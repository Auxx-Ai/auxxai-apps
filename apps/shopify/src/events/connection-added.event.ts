// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'
import { createWebhookHandler, updateWebhookHandler } from '@auxx/sdk/server'
import { shopifyApi, getShopDomain } from '../blocks/shopify/shared/shopify-api'

const WEBHOOK_TOPICS = [
  'orders/create',
  'orders/update',
  'orders/cancelled',
  'orders/fulfilled',
  'orders/paid',
  'products/create',
  'products/update',
  'products/delete',
  'customers/create',
  'customers/update',
  'refunds/create',
  'app/uninstalled',
]

export default async function connectionAdded({ connection }: { connection: Connection }) {
  const token = connection.value
  if (!token) return

  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) return

  const handler = await createWebhookHandler({
    fileName: 'shopify-events',
    triggerId: 'shopify.shopify-trigger',
    connectionId: connection.id,
  })

  const webhookIds: string[] = []
  for (const topic of WEBHOOK_TOPICS) {
    try {
      const result = await shopifyApi<{ webhook: { id: number } }>(
        shopDomain,
        token,
        '/webhooks.json',
        {
          method: 'POST',
          body: {
            webhook: {
              topic,
              address: handler.url,
              format: 'json',
            },
          },
        }
      )
      webhookIds.push(String(result.webhook.id))
    } catch (err) {
      console.error(`[shopify] Failed to register webhook for ${topic}:`, err)
    }
  }

  await updateWebhookHandler(handler.id, {
    metadata: {
      webhookIds,
      shopDomain,
      registeredAt: new Date().toISOString(),
    },
  })

  console.log('[shopify] Webhooks registered:', webhookIds.length, 'of', WEBHOOK_TOPICS.length)
}
