// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * Twilio auth tokens don't require webhook registration, so this is a no-op.
 */
export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No-op — Twilio uses Basic Auth with Account SID + Auth Token
}
