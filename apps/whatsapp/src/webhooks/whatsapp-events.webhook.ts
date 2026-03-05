// src/webhooks/whatsapp-events.webhook.ts

import { extractTriggerData } from '../blocks/whatsapp/triggers/message-received/shared/message-received-types'

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

  // GET requests: webhook verification (challenge-response)
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

  // POST requests: incoming events
  try {
    const payload = await req.json()

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
