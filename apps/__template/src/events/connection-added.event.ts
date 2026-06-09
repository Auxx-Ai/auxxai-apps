// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Runs when a connection is added. Optionally return `{ label }` to name the
 * connection in the connections list (otherwise it falls back to the app name,
 * e.g. "Acme (2)"). Use whatever identifies the account — the authenticated
 * email, a workspace name, a shop domain, etc.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  // const profile = await fetch('https://api.acmeinc.com/me', {
  //   headers: { Authorization: `Bearer ${connection.value}` },
  // }).then((r) => r.json())
  // return { label: profile.email }

  return {}
}
