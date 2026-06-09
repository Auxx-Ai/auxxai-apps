// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'

/**
 * Label the connection with the QuickBooks company name (falling back to the
 * realm id). QuickBooks has no webhook system, so no webhook setup here.
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
      connection.value
    )
    const name = info?.CompanyInfo?.CompanyName
    if (name) return { label: name }
  } catch {
    // Fall back to the realm id below.
  }
  return { label: `Company ${realmId}` }
}
