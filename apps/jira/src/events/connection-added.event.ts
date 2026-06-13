// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Label the connection with the connected Atlassian site name.
 * Jira does not support outbound webhooks via OAuth here, so no webhook setup.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const resources = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { Authorization: `Bearer ${connection.value}`, Accept: 'application/json' },
    }).then((r) => r.json())
    const site = Array.isArray(resources) ? resources[0] : undefined
    const label = site?.name || site?.url
    if (label) return { label }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
