// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Label the connection with the signed-in Microsoft account (UPN / email).
 * Teams webhook subscriptions may be added in a future release.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const me = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${connection.value}` },
    }).then((r) => r.json())
    const label = me?.userPrincipalName || me?.mail || me?.displayName
    if (label) return { label }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
