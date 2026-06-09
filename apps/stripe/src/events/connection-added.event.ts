// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Label the connection with the Stripe account's display name or email.
 * Future: set up Stripe webhook endpoints for trigger support.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  try {
    const account = await fetch('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${connection.value}` },
    }).then((r) => r.json())
    const label =
      account?.settings?.dashboard?.display_name ||
      account?.business_profile?.name ||
      account?.email
    if (label) return { label }
  } catch {
    // Fall back to the default label.
  }
  return {}
}
