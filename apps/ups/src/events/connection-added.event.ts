// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * No-op. UPS uses the platform-managed `oauth2-code` flow, so there are no
 * webhooks to register and the token response carries no account identity worth
 * relabeling the connection by. The first tool call uses the token the platform
 * already stored.
 */
export default async function connectionAdded(_args: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  return {}
}
