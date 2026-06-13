// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Label the connection with the HubSpot account domain (or the authenticating
 * user). HubSpot has no per-connection webhook setup here.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const info = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${connection.value}`, {
      headers: { Accept: 'application/json' },
    }).then((r) => r.json())
    const label = info?.hub_domain || info?.user
    if (label) return { label }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
