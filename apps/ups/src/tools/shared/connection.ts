// src/tools/shared/connection.ts

import { getConnection } from '@auxx/sdk/server'

/**
 * Throw the platform's standard "not connected" error, which surfaces the
 * reconnect UX in Settings → Apps → UPS.
 */
export function throwConnectionNotFound(): never {
  const err = new Error('UPS not connected. Please connect in Settings → Apps → UPS.') as Error & {
    code: string
    scope: string
  }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

/**
 * Resolve the UPS OAuth bearer token from the connection bound to the current
 * invocation. UPS uses the platform-managed `oauth2-code` flow, so the access
 * token lives on `connection.value` and the platform refreshes it lazily ahead
 * of expiry — tool code never mints or refreshes tokens itself.
 */
/**
 * True when this connection was made with the CIE test-environment box ticked.
 * It rides on the connection rather than the installation so it cannot drift
 * away from the token it was minted beside.
 */
export function isUpsTestEnvironment(): boolean {
  return getConnection()?.fields?.test_environment === 'true'
}

export function getUpsConnection(): { token: string } {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  return { token: connection.value }
}
