// src/webhooks/slack-events.webhook.ts

import { getOrganizationSetting } from '@auxx/sdk/server'

/**
 * Slack Events API webhook handler.
 *
 * Verifies the request signature using the Signing Secret, handles the
 * URL verification challenge, and returns dispatch data for the
 * `slack.app-mention` workflow trigger when `app_mention` events arrive.
 *
 * See plans/kopilot/apps/slack-overhaul.md §7b.
 */
export default async function slackEventsWebhook(
  req: Request
): Promise<
  Response | { response: Response; triggerData: Record<string, unknown>; eventId: string }
> {
  const timestamp = req.headers.get('X-Slack-Request-Timestamp')
  const signature = req.headers.get('X-Slack-Signature')
  const body = await req.text()

  if (!timestamp || !signature) {
    return new Response('Missing Slack signature headers', { status: 400 })
  }

  // Reject requests older than 5 minutes (replay attack protection)
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (age > 300) {
    return new Response('Request timestamp too old', { status: 403 })
  }

  // Verify HMAC-SHA256 signature
  const signingSecret = await getOrganizationSetting('signingSecret')
  if (!signingSecret) {
    console.error('[slack-events] Signing secret not configured')
    return new Response('Slack signing secret not configured', { status: 500 })
  }

  const baseString = `v0:${timestamp}:${body}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(baseString))
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
  const computed = `v0=${hex}`

  if (computed !== signature) {
    return new Response('Invalid signature', { status: 403 })
  }

  const payload = JSON.parse(body)

  // Handle Slack URL verification challenge
  if (payload.type === 'url_verification') {
    return new Response(JSON.stringify({ challenge: payload.challenge }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const okResponse = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  // Dispatch app_mention events to the workflow trigger.
  // Other event types (message.channels, message.im, reaction_added) are
  // deferred per plans/kopilot/apps/slack-overhaul.md §8.
  if (payload.event?.type === 'app_mention') {
    const event = payload.event
    const teamId: string = payload.team_id ?? event.team ?? ''
    const channelId: string = event.channel ?? ''
    const userId: string = event.user ?? ''
    const ts: string = event.ts ?? ''
    const threadTs: string = event.thread_ts ?? ''
    const text: string = event.text ?? ''
    const botUserId: string = payload.authorizations?.[0]?.user_id ?? ''
    const eventId: string = payload.event_id ?? `slack-app_mention-${ts || Date.now()}`

    return {
      response: okResponse(),
      eventId,
      triggerData: {
        teamId,
        channelId,
        userId,
        text,
        ts,
        threadTs,
        botUserId,
      },
    }
  }

  return okResponse()
}
