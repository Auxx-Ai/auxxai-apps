// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'
import { createWebhookHandler, updateWebhookHandler } from '@auxx/sdk/server'
import { TELEGRAM_API } from '../blocks/telegram/shared/telegram-api'

export default async function connectionAdded({ connection }: { connection: Connection }) {
  const botToken = connection.value

  // 1. Create webhook handler with trigger + connection binding.
  //    connectionId scopes the handler to this specific bot token.
  //    The generated URL: /webhooks/{installationId}/telegram-update/{connectionId}
  const handler = await createWebhookHandler({
    fileName: 'telegram-update',
    triggerId: 'telegram.update-received',
    connectionId: connection.id,
  })

  // 2. Generate a secret token for webhook verification
  const secretToken = crypto.randomUUID().replace(/-/g, '')

  // 3. Register webhook with Telegram
  const response = await fetch(`${TELEGRAM_API}/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: handler.url,
      allowed_updates: [
        'message',
        'edited_message',
        'callback_query',
        'channel_post',
        'edited_channel_post',
      ],
      secret_token: secretToken,
      max_connections: 40,
    }),
  })

  const result = (await response.json()) as { ok: boolean; description?: string }

  if (!result.ok) {
    console.error('[telegram] Failed to set webhook:', result.description)
    throw new Error(`Failed to register Telegram webhook: ${result.description}`)
  }

  // 4. Store webhook registration metadata
  await updateWebhookHandler(handler.id, {
    externalWebhookId: `telegram-webhook-${botToken.slice(-6)}`,
    metadata: {
      secretToken,
      botTokenSuffix: botToken.slice(-6),
      registeredAt: new Date().toISOString(),
    },
  })

  console.log('[telegram] Webhook registered:', handler.url)
}
