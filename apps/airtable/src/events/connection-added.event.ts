// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Label the connection with the authenticated Airtable user's email when the
 * granted scopes expose it (user.email:read). Airtable has no webhook system,
 * so no webhook setup here.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const me = await fetch('https://api.airtable.com/v0/meta/whoami', {
      headers: { Authorization: `Bearer ${connection.value}` },
    }).then((r) => r.json())
    if (me?.email) return { label: me.email }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
