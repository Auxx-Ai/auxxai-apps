// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'

/**
 * Label the connection with the QuickBooks company name.
 *
 * QuickBooks has no webhook system, so no webhook setup here.
 *
 * 🛑 The environment is NOT optional. A sandbox realm does not exist on
 * `quickbooks.api.intuit.com`, so calling the production host for one 404s —
 * and this handler shipped without it for a week without anyone noticing,
 * because it fell back to forging `Company ${realmId}`, which is visually
 * identical to the autoincrement label the platform assigns when a handler
 * returns nothing. A successful read and a total failure printed the same
 * string.
 *
 * So: read the environment, and on failure return `{}` rather than a name.
 * `saveAppConnection` keeps its own label when a handler is silent, and a dull
 * label is honest where a forged one is not.
 *
 * `sandbox` is a connection VARIABLE, not an app setting — it arrives on
 * `connection.fields` with the value the org ticked on the connect form, in the
 * same payload as the token it belongs to. It is a string because the connect
 * form serialises every variable that way.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  const realmId = connection.metadata?.realmId as string | undefined
  if (!realmId) return {}

  try {
    const info = await quickbooksApi<{ CompanyInfo?: { CompanyName?: string } }>(
      realmId,
      `/companyinfo/${realmId}`,
      connection.value,
      { sandbox: connection.fields?.sandbox === 'true' }
    )
    const name = info?.CompanyInfo?.CompanyName
    if (name) return { label: name }
  } catch {
    // Naming is cosmetic. A connect that works must never fail because the
    // company name could not be read.
  }
  return {}
}
