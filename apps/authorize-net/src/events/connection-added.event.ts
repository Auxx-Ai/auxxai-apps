// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Name a newly connected Authorize.net account by its API Login ID. Registers nothing
 * upstream: settlement webhooks are unproven here (build plan §3.5) and syncing is
 * scheduled.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  const apiLoginId = connection.fields?.api_login_id?.trim()
  if (!apiLoginId) return {}
  const environment = connection.fields?.environment?.trim() || 'live'
  return {
    label:
      environment === 'test'
        ? `Authorize.net ${apiLoginId} (sandbox)`
        : `Authorize.net ${apiLoginId}`,
  }
}
