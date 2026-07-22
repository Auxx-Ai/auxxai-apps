// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. Introspects the fresh OAuth token to read the
 * stable numeric HubSpot portal id (`hub_id`). Unlike the account domain, the
 * portal id never changes, so returning it lets the platform dedupe re-connects
 * of the same account in place. This performs a single read-only GET and makes
 * no mutations.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  try {
    const info = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${connection.value}`, {
      headers: { Accept: 'application/json' },
    }).then((r) => r.json())
    if (info?.hub_id != null) return { identifier: String(info.hub_id) }
  } catch {
    // On any error, fall through to no identity.
  }
  return {}
}
