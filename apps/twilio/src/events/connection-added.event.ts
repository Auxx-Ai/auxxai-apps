// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'
import { getOrganizationSettings } from '@auxx/sdk/server'

/**
 * Twilio auth tokens don't require webhook registration. Label the connection
 * with the configured Account SID so it's recognizable in the list.
 */
export default async function connectionAdded(
  _args: { connection: Connection }
): Promise<ConnectionAddedResult> {
  try {
    const settings = await getOrganizationSettings<{ accountSid?: string }>()
    const accountSid = settings?.accountSid?.trim()
    if (accountSid) return { label: accountSid }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
