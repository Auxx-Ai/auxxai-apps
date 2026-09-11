// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * No-op. The app registers no ShipStation webhooks, so a removed connection
 * leaves nothing upstream to tear down. The V2 webhook contract is unverified
 * (`GET /v2/environment/webhooks` returned an empty list during the probe) and
 * the app must never delete hooks it did not create.
 */
export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // Nothing to clean up upstream.
}
