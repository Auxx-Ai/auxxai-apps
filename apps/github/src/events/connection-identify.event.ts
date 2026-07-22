// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. Reads the authenticated GitHub user via the
 * same `/user` endpoint connection-added uses, but returns the numeric account
 * id rather than the login — logins are renameable, the id is stable. Uses the
 * fresh OAuth access token from `connection.value` since no credential exists
 * yet at pre-insert time. GET only, no side effects.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  try {
    const user = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${connection.value}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'auxx',
      },
    }).then((r) => r.json())
    if (user?.id) return { identifier: String(user.id) }
  } catch {
    // Fall back to no identifier.
  }
  return {}
}
