// src/events/connection-added.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * Discord uses a static Bot Token — no webhook setup needed on connection.
 */
export default async function connectionAdded({ connection }: { connection: Connection }) {
  // No-op — Discord bot tokens don't require webhook registration
}
