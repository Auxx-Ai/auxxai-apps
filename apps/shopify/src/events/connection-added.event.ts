// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'
import { createWebhookHandler, updateWebhookHandler } from '@auxx/sdk/server'
import { shopifyApi, getShopDomain } from '../blocks/shopify/shared/shopify-api'

// Topics we attempt to register. Note Shopify gates orders/*, customers/* and
// fulfillments/* behind Protected Customer Data approval (Partner Dashboard) and
// their read scopes — without those they're rejected at registration.
// draft_orders/* and inventory_items/* likewise need read_draft_orders /
// read_inventory. Topics the store can't grant are skipped with one warning below.
const WEBHOOK_TOPICS = [
  'orders/create',
  'orders/updated',
  'orders/cancelled',
  'orders/fulfilled',
  'orders/paid',
  'products/create',
  'products/update',
  'products/delete',
  'customers/create',
  'customers/update',
  'fulfillments/create',
  'fulfillments/update',
  'draft_orders/create',
  'draft_orders/update',
  'inventory_items/create',
  'inventory_items/update',
  'inventory_items/delete',
  'collections/create',
  'collections/update',
  'collections/delete',
  'refunds/create',
  'app/uninstalled',
]

export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  const token = connection.value
  if (!token) return {}

  const shopDomain = getShopDomain(connection.metadata)
  if (!shopDomain) return {}

  const handler = await createWebhookHandler({
    fileName: 'shopify-events',
    triggerId: 'shopify.shopify-trigger',
    connectionId: connection.id,
  })

  const webhookIds: string[] = []
  const skipped: string[] = []
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
    } catch {
      // Expected for topics the store can't grant (missing scope / no Protected
      // Customer Data approval). Collect and summarize rather than logging a
      // stack trace per topic.
      skipped.push(topic)
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
  if (skipped.length) {
    console.warn(
      `[shopify] Skipped ${skipped.length} webhook topic(s) — likely missing scope or Protected Customer Data approval: ${skipped.join(', ')}`
    )
  }

  // Name the connection after the store so it's recognizable in the list
  // (e.g. "mystore.myshopify.com" instead of "Shopify").
  return { label: shopDomain }
}
