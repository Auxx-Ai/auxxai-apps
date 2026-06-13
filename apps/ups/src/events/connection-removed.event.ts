// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * No-op. UPS has no webhooks to unregister, and the connection-scoped `watch`
 * KV collection is removed automatically by the `AppStorage.connectionId` FK
 * cascade when the credential is deleted.
 */
export default async function connectionRemoved(_args: { connection: Connection }) {
  // Nothing to clean up — KV cascade handles the watch registry.
}
