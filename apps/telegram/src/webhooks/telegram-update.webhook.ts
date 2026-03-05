// src/webhooks/telegram-update.webhook.ts

import { extractUpdateTriggerData } from '../blocks/telegram/triggers/shared/telegram-trigger-types'

export default async function telegramUpdateWebhook(
  req: Request,
): Promise<
  Response | { response: Response; triggerData: Record<string, unknown>; eventId: string }
> {
  const okResponse = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  try {
    const update = await req.json()
    const triggerData = extractUpdateTriggerData(update)

    if (!triggerData) {
      // Unhandled update type — respond 200 so Telegram doesn't retry
      return okResponse()
    }

    const updateId = update.update_id
    const eventIdPrefix = triggerData.updateType === 'callback_query' ? 'tg-cb' : 'tg-msg'

    return {
      response: okResponse(),
      triggerData,
      eventId: `${eventIdPrefix}-${updateId}`,
    }
  } catch (error) {
    console.error('[telegram-update.webhook] Error processing update:', error)
    // Still 200 to prevent Telegram retries
    return okResponse()
  }
}
