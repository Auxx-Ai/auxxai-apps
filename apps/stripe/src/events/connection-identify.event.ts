// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. Reads the Stripe account's stable `acct_…` id
 * via `/v1/account` using the fresh OAuth token / secret key on the connection.
 * The stable account id (not the display name from connection-added) lets the
 * platform dedupe re-connects of the same account in place. Read-only.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  try {
    const account = await fetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${connection.value}` },
    }).then((r) => r.json())
    if (account?.id) return { identifier: account.id }
  } catch {
    // Fall back to no identity.
  }
  return {}
}
