// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * No-op — Microsoft Teams webhook subscriptions may be added in a future release.
 */
export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No-op initially
}
