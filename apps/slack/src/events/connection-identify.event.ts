// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. Reads the Slack workspace's stable `team_id`
 * via `auth.test` using the fresh OAuth token on the connection. The stable id
 * (not the display name from connection-added) lets the platform dedupe
 * re-connects of the same workspace in place. Read-only; no side effects.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  try {
    const auth = await fetch('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${connection.value}` },
    }).then((r) => r.json())
    // Slack returns HTTP 200 with { ok: false } on error, so guard on ok.
    if (auth?.ok === true && auth.team_id) return { identifier: auth.team_id }
  } catch {
    // Fall back to no identity.
  }
  return {}
}
