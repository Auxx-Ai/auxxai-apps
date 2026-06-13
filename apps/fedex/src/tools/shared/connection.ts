// src/tools/shared/connection.ts

import { getConnection } from '@auxx/sdk/server'

export interface FedexCredentials {
  clientId: string
  clientSecret: string
  /** 9-digit FedEx account number. Empty string when not provided (reference lookups require it). */
  accountNumber: string
}

/**
 * Throw the platform's standard "not connected" error, which surfaces the
 * reconnect UX in Settings → Apps → FedEx.
 */
export function throwConnectionNotFound(): never {
  const err = new Error(
    'FedEx not connected. Please connect in Settings → Apps → FedEx.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/**
 * Resolve the FedEx credentials from the connection bound to the current
 * invocation. FedEx is a multi-field secret connection, so everything lives on
 * `connection.fields` — `connection.value` is empty.
 */
export function getFedexCredentials(): FedexCredentials {
  const connection = getConnection()
  const f = connection.fields
  if (!f?.client_id || !f?.client_secret) throwConnectionNotFound()
  return {
    clientId: f.client_id,
    clientSecret: f.client_secret,
    accountNumber: f.account_number ?? '',
  }
}
