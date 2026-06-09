// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Discord uses a static Bot Token — no webhook setup needed on connection.
 * Label the connection with the bot's username.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const me = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${connection.value}` },
    }).then((r) => r.json())
    if (me?.username) return { label: me.username }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
