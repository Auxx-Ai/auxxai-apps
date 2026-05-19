// src/webhooks/whatsapp-events.webhook.ts

import { getOrganizationSetting } from '@auxx/sdk/server'
import { extractTriggerData } from '../blocks/whatsapp/triggers/message-received/shared/message-received-types'

/**
 * WhatsApp Cloud API webhook handler.
 *
 * Verifies the `x-hub-signature-256` HMAC using the org's stored Meta App
 * Secret, handles Meta's GET `hub.challenge` verification, then extracts
 * trigger data for the `whatsapp.message-received` workflow trigger.
 *
 * See plans/kopilot/apps/whatsapp-overhaul.md §7b.
 */
export default async function whatsappEventsWebhook(
  req: Request
): Promise<
  Response | { response: Response; triggerData: Record<string, unknown>; eventId: string }
> {
  const okResponse = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  // GET requests: webhook verification (challenge-response).
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // POST requests: signed event payloads.
  const signatureHeader = req.headers.get('x-hub-signature-256') ?? ''
  if (!signatureHeader.startsWith('sha256=')) {
    return new Response('Missing x-hub-signature-256', { status: 400 })
  }

  // Read the raw body once — must feed HMAC before JSON.parse since the
  // Fetch Request body can only be consumed once.
  const rawBody = await req.text()

  const appSecret = await getOrganizationSetting('appSecret')
  if (!appSecret) {
    console.error('[whatsapp-events] Meta App Secret not configured')
    return new Response('App secret not configured', { status: 500 })
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(appSecret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const computedHex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
  const givenHex = signatureHeader.slice('sha256='.length)

  if (!timingSafeEqualHex(computedHex, givenHex)) {
    return new Response('Invalid signature', { status: 403 })
  }

  try {
    const payload = JSON.parse(rawBody)
    if (payload.object !== 'whatsapp_business_account') {
      return okResponse()
    }

    for (const entry of payload.entry ?? []) {
      const items = extractTriggerData(entry)
      if (items.length > 0) {
        const item = items[0]
        const prefix = item.eventType === 'status' ? 'wa-status' : 'wa-msg'
        return {
          response: okResponse(),
          triggerData: item as unknown as Record<string, unknown>,
          eventId: `${prefix}-${item.messageId}`,
        }
      }
    }

    return okResponse()
  } catch (error) {
    console.error('[whatsapp-events.webhook] Error processing payload:', error)
    return okResponse()
  }
}

/**
 * Constant-time hex string comparison. Returns false on length mismatch
 * before any byte comparison; otherwise XORs each pair, accumulating into
 * a single result so timing is independent of where a mismatch occurs.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
