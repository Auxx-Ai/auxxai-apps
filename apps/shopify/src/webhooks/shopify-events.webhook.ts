// src/webhooks/shopify-events.webhook.ts

import { extractTriggerData } from '../blocks/shopify/triggers/shopify-trigger/shared/shopify-trigger-types'

const okResponse = () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

export default async function shopifyEventsWebhook(
  req: Request
): Promise<
  Response | { response: Response; triggerData: Record<string, unknown>; eventId: string }
> {
  try {
    const topic = req.headers.get('x-shopify-topic')
    const hmac = req.headers.get('x-shopify-hmac-sha256')
    const shopDomain = req.headers.get('x-shopify-shop-domain')

    if (!topic || !hmac || !shopDomain) {
      return new Response('Missing headers', { status: 400 })
    }

    const payload = await req.json()
    const triggerData = extractTriggerData(topic, shopDomain, payload)

    if (!triggerData) return okResponse()

    const eventId = `shopify-${topic}-${payload.id ?? Date.now()}`

    return {
      response: okResponse(),
      triggerData,
      eventId,
    }
  } catch (error) {
    console.error('[shopify-events.webhook] Error processing webhook:', error)
    return okResponse()
  }
}
