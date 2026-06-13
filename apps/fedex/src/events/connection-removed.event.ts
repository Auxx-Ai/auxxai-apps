// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * No-op. FedEx has no webhooks to unregister, and the KV rows (token cache +
 * watch registry) are removed automatically by the connectionId FK cascade.
 */
export default async function connectionRemoved(_args: { connection: Connection }) {
  // Nothing to clean up — KV cascade handles token cache + watch registry.
}
