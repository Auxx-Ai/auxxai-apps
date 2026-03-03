// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * No cleanup needed when Twilio connection is removed.
 */
export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // No-op — Twilio has no registered webhooks to clean up
}
