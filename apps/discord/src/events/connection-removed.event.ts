// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * Discord uses a static Bot Token — no webhook cleanup needed on disconnection.
 */
export default async function connectionRemoved({ connection }: { connection: Connection }) {
  // No-op — Discord bot tokens don't require webhook cleanup
}
