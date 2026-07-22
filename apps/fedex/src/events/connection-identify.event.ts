// src/events/connection-identify.event.ts

import type { ConnectionIdentifyResult, IdentifyConnection } from '@auxx/sdk/server'

/**
 * Pure pre-insert identity hook. FedEx is a multi-field secret connection, so
 * the account number is already submitted on `connection.fields.account_number`
 * — the identity is available with no API call or side effects. Returning the
 * account number lets the platform dedupe re-connects of the same account in
 * place.
 */
export default async function connectionIdentify({
  connection,
}: {
  connection: IdentifyConnection
}): Promise<ConnectionIdentifyResult> {
  const accountNumber = connection.fields?.account_number
  return accountNumber ? { identifier: accountNumber } : {}
}
