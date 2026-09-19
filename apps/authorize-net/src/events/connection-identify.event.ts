// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Identify a fresh connection by API Login ID, scoped to the environment. Pre-insert and
 * side-effect free, so it makes no provider call for the gateway id; the environment
 * scope keeps a sandbox book from merging into the real one.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  const apiLoginId = connection.fields?.api_login_id?.trim()
  if (!apiLoginId) return {}
  const environment = connection.fields?.environment?.trim() || 'live'
  return { identifier: `${environment}:${apiLoginId}` }
}
