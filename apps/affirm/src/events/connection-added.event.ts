// src/events/connection-added.event.ts

import type { Connection, ConnectionAddedResult } from '@auxx/sdk/server'

/**
 * Name a newly connected Affirm account by its Merchant ID.
 *
 * Runs AFTER insert, and only for genuinely new connections —
 * `connection-identify` has already deduped on the same value, so a key
 * rotation on an existing merchant never reaches here.
 *
 * The merchant ARI is the only account-identifying value Affirm gives us
 * without a provider call: there is no `/me`, and the API key pair must never
 * be shown. It is also what appears in `FinancialSourceAccount`, so labelling
 * the connection with it makes the connections list and the financial rows say
 * the same thing.
 *
 * No provider state is touched. Affirm has no proven settlement webhook to
 * register (build plan §3.5); syncing is scheduled.
 */
export default async function connectionAdded({
  connection,
}: {
  connection: Connection
}): Promise<ConnectionAddedResult> {
  const merchantId = connection.fields?.merchant_id
  return merchantId && merchantId.trim() !== '' ? { label: `Affirm ${merchantId.trim()}` } : {}
}
