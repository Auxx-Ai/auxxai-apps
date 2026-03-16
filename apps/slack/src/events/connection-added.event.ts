// src/events/connection-added.event.ts

import { createWebhookHandler } from '@auxx/sdk/server'
import type { Connection } from '@auxx/sdk/server'

/**
 * Called when a Slack OAuth2 connection is added.
 * Registers the Slack Events API webhook handler so Slack can deliver events.
 *
 * Note: Slack doesn't have an API to programmatically register event subscriptions.
 * The user must manually set the Request URL in their Slack app's "Event Subscriptions"
 * page to the URL returned by createWebhookHandler. The handler will respond to Slack's
 * URL verification challenge automatically.
 */
export default async function connectionAdded({ connection }: { connection: Connection }) {
  const webhookHandler = await createWebhookHandler({
    fileName: 'slack-events',
    connectionId: connection.id,
  })

  // The user needs to copy webhookHandler.url into their Slack app's
  // Event Subscriptions → Request URL field. The webhook handler will
  // automatically respond to Slack's url_verification challenge.
  console.log('[slack] Webhook handler created:', webhookHandler.url)
}
