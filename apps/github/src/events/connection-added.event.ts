// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Label the connection with the authenticated GitHub username.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const user = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${connection.value}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'auxx',
      },
    }).then((r) => r.json())
    if (user?.login) return { label: user.login }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
