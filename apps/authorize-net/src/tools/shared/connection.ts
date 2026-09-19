// src/tools/shared/connection.ts

// A multi-field `secret` connection: everything is on `getConnection().fields` and
// `connection.value` is empty.

import { getConnection } from '@auxx/sdk/server'

/** Which Authorize.net book a credential belongs to. */
export type AuthorizeNetEnvironment = 'live' | 'test'

/** What every Authorize.net call needs: the two secrets plus the book to send them to. */
export interface AuthorizeNetCredentials {
  /** API Login ID — `merchantAuthentication.name`. Also the fallback account identity. */
  apiLoginId: string
  /** Transaction Key — `merchantAuthentication.transactionKey`. Never logged. */
  transactionKey: string
  environment: AuthorizeNetEnvironment
}

/** Throw the platform's structured "not connected" error, which surfaces the reconnect prompt. */
export function throwConnectionNotFound(): never {
  const err = new Error(
    'Authorize.net is not connected. Add your API Login ID and Transaction Key in Settings → Apps → Authorize.net.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/**
 * Read the fields off an already-resolved connection. An unrecognised `environment` is
 * refused rather than treated as production, because it is part of every `sourceKey`.
 */
export function authorizeNetCredentialsFrom(
  fields: Record<string, string> | undefined
): AuthorizeNetCredentials {
  if (!fields?.api_login_id || !fields?.transaction_key) throwConnectionNotFound()
  const environment = (fields.environment ?? '').trim() || 'live'
  if (environment !== 'live' && environment !== 'test') {
    throw new Error(`Unknown Authorize.net environment: ${environment}`)
  }
  return {
    apiLoginId: fields.api_login_id,
    transactionKey: fields.transaction_key,
    environment,
  }
}

/** Read the fields off the connection bound to the current tool invocation. */
export function getAuthorizeNetCredentials(): AuthorizeNetCredentials {
  return authorizeNetCredentialsFrom(getConnection()?.fields)
}
