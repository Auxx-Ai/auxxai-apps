// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Label the connection with the authenticated Google account email so users can
 * tell connected accounts apart. No webhook setup — polling triggers are
 * managed by the platform.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const profile = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${connection.value}` },
    }).then((r) => r.json())
    if (profile?.email) return { label: profile.email }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
