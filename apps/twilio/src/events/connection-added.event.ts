// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Twilio auth tokens don't require webhook registration. Label the connection with
 * its own Account SID, which now arrives on the connection being added rather than
 * from an org-wide setting — so two Twilio accounts in one org stay tellable apart.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  const accountSid = connection.fields?.account_sid?.trim()
  return accountSid ? { label: accountSid } : {}
}
