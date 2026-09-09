// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Supabase requires no connection-time setup beyond storing the Service Role key
 * (realtime triggers are deferred — see §13 of the implementation plan). Label the
 * connection with its own project host, which arrives on the connection being added
 * rather than from an org-wide setting — so two Supabase projects in one org stay
 * tellable apart.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  const projectUrl = connection.fields?.project_url?.trim()
  if (!projectUrl) return {}
  const host = projectUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return host ? { label: host } : {}
}
