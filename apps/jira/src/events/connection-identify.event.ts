// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. Reads the stable Atlassian cloud id from the
 * accessible-resources endpoint using the fresh OAuth token on the connection.
 * The cloud id (a UUID) is stable across re-connects, so returning it lets the
 * platform dedupe re-connects of the same site in place. This performs a single
 * read-only GET and makes no mutations.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  try {
    const resources = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { Authorization: `Bearer ${connection.value}`, Accept: 'application/json' },
    }).then((r) => r.json())
    const site = Array.isArray(resources) ? resources[0] : undefined
    if (site?.id) return { identifier: String(site.id) }
  } catch {
    // On any error, fall through to no identity.
  }
  return {}
}
