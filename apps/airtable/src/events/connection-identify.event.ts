// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. Reads the authenticated Airtable user via the
 * same `whoami` endpoint connection-added uses, but returns the stable user id
 * rather than the email (email may change and requires user.email:read scope).
 * Uses the fresh OAuth access token from `connection.value` since no credential
 * exists yet at pre-insert time. GET only, no side effects.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  try {
    const me = await fetch('https://api.airtable.com/v0/meta/whoami', {
      headers: { Authorization: `Bearer ${connection.value}` },
    }).then((r) => r.json())
    if (me?.id) return { identifier: me.id }
  } catch {
    // Fall back to no identifier.
  }
  return {}
}
