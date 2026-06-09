// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'
import {
  createWebhookHandler,
  updateWebhookHandler,
  getOrganizationSettings,
} from '@auxx/sdk/server'
import { WHATSAPP_API, whatsappApi } from '../blocks/whatsapp/shared/whatsapp-api'

export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  const accessToken = connection.value
  const settings = await getOrganizationSettings<{
    appId?: string
    appSecret?: string
    businessAccountId?: string
  }>()
  const appId = settings?.appId
  const appSecret = settings?.appSecret

  if (!appId || !appSecret) {
    console.error(
      '[whatsapp] Missing appId or appSecret in settings. Skipping webhook registration.'
    )
    return await whatsappLabel(settings?.businessAccountId, accessToken)
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

  return await whatsappLabel(settings?.businessAccountId, accessToken)
}

/**
 * Label the connection with the first WhatsApp business phone number
 * (e.g. "+1 555-0100 (Acme)"), falling back to the default label.
 */
async function whatsappLabel(
  businessAccountId: string | undefined,
  accessToken: string
): Promise<ConnectionAddedResult> {
  if (!businessAccountId) return {}
  try {
    const response = await whatsappApi<{
      data: { display_phone_number: string; verified_name: string }[]
    }>(`${businessAccountId}/phone_numbers`, accessToken)
    const phone = response.data?.[0]
    if (phone) {
      return {
        label: phone.verified_name
          ? `${phone.display_phone_number} (${phone.verified_name})`
          : phone.display_phone_number,
      }
    }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
