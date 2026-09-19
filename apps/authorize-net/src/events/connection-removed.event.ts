// src/events/connection-removed.event.ts

import type { Connection } from '@auxx/sdk/server'

/**
 * No-op: nothing was registered upstream, a Transaction Key is rotated in the Merchant
 * Interface, and rows already written are evidence for money that really moved.
 */
export default async function connectionRemoved({
  connection: _connection,
}: {
  connection: Connection
}) {
  // Intentionally empty.
}
