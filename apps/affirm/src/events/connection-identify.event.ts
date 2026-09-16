// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Identify a fresh Affirm connection by its **Merchant ID**.
 *
 * Affirm has a genuine answer here, unlike ShipStation: the merchant ARI (e.g.
 * `07JVNWWI5PZM8L7Y`) is a **stable upstream account identity**. It is the
 * `merchant_id` every settlement and transaction call requires, it is visible
 * in the portal without asking anyone (Synder's guide is wrong that it takes a
 * Client Success Manager), and it is what
 * `FinancialSourceAccount.externalAccountId` is populated with — the same
 * value the connector stamps into every `sourceKey` it writes.
 *
 * So returning it means:
 *
 * - **Dedup is honest.** Re-connecting the same merchant with rotated keys
 *   updates that connection in place instead of creating a second one, and
 *   `connection-added` does NOT re-fire.
 * - **Two different merchants stay two connections**, which matters more here
 *   than usual: the merchant id is the account half of every financial row's
 *   identity, so merging two merchants would merge two sets of books.
 *
 * This handler is PRE-insert and must stay side-effect free. It reads the
 * submitted connection variables only — no provider call is needed, and none
 * is made, because the identity is already in hand.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  const merchantId = connection.fields?.merchant_id
  // An empty identifier skips dedup rather than deduping everything onto ''.
  return merchantId && merchantId.trim() !== '' ? { identifier: merchantId.trim() } : {}
}
