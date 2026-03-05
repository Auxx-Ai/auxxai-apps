// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'
import {
  createWebhookHandler,
  updateWebhookHandler,
  getOrganizationSettings,
} from '@auxx/sdk/server'
import { WHATSAPP_API } from '../blocks/whatsapp/shared/whatsapp-api'

export default async function connectionAdded({ connection }: { connection: Connection }) {
  const accessToken = connection.value
  const settings = await getOrganizationSettings<{ appId?: string; appSecret?: string }>()
  const appId = settings?.appId
  const appSecret = settings?.appSecret

  if (!appId || !appSecret) {
    console.error(
      '[whatsapp] Missing appId or appSecret in settings. Skipping webhook registration.'
    )
    return
  }

  // 1. Create webhook handler with trigger + connection binding
  const handler = await createWebhookHandler({
    fileName: 'whatsapp-events',
    triggerId: 'whatsapp.message-received',
    connectionId: connection.id,
  })

  // 2. Generate a verify token for webhook verification
  const verifyToken = crypto.randomUUID().replace(/-/g, '')

  // 3. Register webhook subscription with Meta Graph API
  const response = await fetch(`${WHATSAPP_API}/${appId}/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      object: 'whatsapp_business_account',
      callback_url: handler.url,
      verify_token: verifyToken,
      fields: JSON.stringify(['messages']),
      include_values: true,
    }),
  })

  const result = (await response.json()) as { success?: boolean; error?: { message: string } }

  if (!result.success) {
    console.error('[whatsapp] Failed to register webhook:', result.error?.message)
    throw new Error(`Failed to register WhatsApp webhook: ${result.error?.message}`)
  }

  // 4. Store webhook registration metadata
  await updateWebhookHandler(handler.id, {
    externalWebhookId: `whatsapp-webhook-${connection.id.slice(-6)}`,
    metadata: {
      verifyToken,
      appId,
      registeredAt: new Date().toISOString(),
    },
  })

  console.log('[whatsapp] Webhook registered:', handler.url)
}
