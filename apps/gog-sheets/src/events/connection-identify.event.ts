// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. Reads the authenticated Google account from the
 * same userinfo endpoint the connection label uses, but returns the stable
 * account id (`sub`) rather than the mutable email. This runs before anything is
 * persisted, so the freshly minted OAuth token on `connection.value` is used as
 * the bearer. Returning the account id lets the platform dedupe re-connects of
 * the same Google account in place. Any failure returns `{}` to skip dedup.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  try {
    const profile = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${connection.value}` },
    }).then((r) => r.json())
    if (profile?.id) return { identifier: String(profile.id) }
  } catch {
    // Skip dedup on any failure.
  }
  return {}
}
