// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. QuickBooks puts the company's `realmId` on the
 * connection metadata via the OAuth callback (callbackMetadataParams), so the
 * identity is already available with no API call or side effects. Returning the
 * realm id lets the platform dedupe re-connects of the same company in place.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  const realmId = connection.metadata?.realmId as string | undefined
  return realmId ? { identifier: realmId } : {}
}
