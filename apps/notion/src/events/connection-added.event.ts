// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Label the connection with the Notion workspace name. The bot user returned by
 * /users/me carries `bot.workspace_name` for integration tokens. Notion has no
 * per-connection webhook setup here.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const me = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        Authorization: `Bearer ${connection.value}`,
        'Notion-Version': '2022-06-28',
      },
    }).then((r) => r.json())
    const label = me?.bot?.workspace_name || me?.name
    if (label) return { label }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
