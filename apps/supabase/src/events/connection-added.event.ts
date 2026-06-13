// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'
import { getOrganizationSetting } from '@auxx/sdk/server'

/**
 * Supabase requires no connection-time setup beyond storing the Service Role
 * key (realtime triggers are deferred — see §13 of the implementation plan).
 * Label the connection with the project host when the projectUrl setting is
 * already configured.
 */
export default async function connectionAdded(_args: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const projectUrl = await getOrganizationSetting<string>('projectUrl')
    if (projectUrl) {
      const host = projectUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
      if (host) return { label: host }
    }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
