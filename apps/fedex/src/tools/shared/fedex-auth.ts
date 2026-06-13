// src/tools/shared/fedex-auth.ts

/**
 * FedEx OAuth2 `client_credentials` token minting + KV cache.
 *
 * FedEx has no hosted login — the app mints its own bearer tokens (TTL ~3600s)
 * from the project's API Key + Secret Key. The token endpoint is rate-limited
 * (~5 req/s, ~1,000/day) and module state does NOT survive between invocations
 * (each run is an isolated sandbox), so the cache must be KV (connection-scoped
 * so multiple FedEx accounts in one org stay separate).
 */

import {
  ConnectionExpiredError,
  RateLimitError,
  UpstreamServiceError,
  getOrganizationSetting,
  storage,
} from '@auxx/sdk/server'
import { getFedexCredentials } from './connection'

const TOKEN_KEY = 'bearer-token'
/** Re-mint while the token is still valid so a call never expires mid-flight. */
const SKEW_SECONDS = 300

const PROD_BASE = 'https://apis.fedex.com'
const SANDBOX_BASE = 'https://apis-sandbox.fedex.com'

/**
 * Base URL for all FedEx API + token calls. Sandbox when the org enables the
 * `useTestEnvironment` setting (requires the org to connect with sandbox keys).
 */
export async function getFedexBaseUrl(): Promise<string> {
  const useTest = await getOrganizationSetting<boolean>('useTestEnvironment')
  return useTest ? SANDBOX_BASE : PROD_BASE
}

/** True when a FedEx error envelope reports an authorization failure. */
function isAuthError(data: unknown): boolean {
  const errors = (data as { errors?: Array<{ code?: string }> })?.errors
  return Array.isArray(errors) && errors.some((e) => e.code === 'NOT.AUTHORIZED.ERROR')
}

/**
 * POST `/oauth/token` with explicit credentials. Used by both the ambient
 * {@link mintToken} and the `connection-added` validation hook (which has the
 * submitted credentials in hand before the connection is KV-resolvable).
 */
export async function requestToken(
  clientId: string,
  clientSecret: string,
  base: string
): Promise<{ token: string; expiresIn: number }> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  let response: Response
  try {
    response = await fetch(`${base}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch (err) {
    throw new UpstreamServiceError(
      err instanceof Error ? err.message : 'FedEx token request failed'
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 || response.status === 403 || isAuthError(data)) {
      throw new ConnectionExpiredError('organization')
    }
    if (response.status === 429) {
      const ra = Number(response.headers.get('Retry-After'))
      throw new RateLimitError(Number.isFinite(ra) ? ra : undefined)
    }
    if (response.status >= 500) {
      throw new UpstreamServiceError(`FedEx token error ${response.status}`, response.status)
    }
    throw new ConnectionExpiredError('organization')
  }

  const token = (data as { access_token?: string }).access_token
  const expiresIn = Number((data as { expires_in?: number }).expires_in) || 3600
  if (!token) throw new ConnectionExpiredError('organization')
  return { token, expiresIn }
}

/**
 * Mint a fresh bearer token for the ambient connection. Exported for tests;
 * normal callers go through {@link getFedexToken}.
 */
export async function mintToken(): Promise<{ token: string; expiresIn: number }> {
  const { clientId, clientSecret } = getFedexCredentials()
  const base = await getFedexBaseUrl()
  return requestToken(clientId, clientSecret, base)
}

/**
 * Return a valid bearer token, minting + caching one on a cache miss.
 *
 * Concurrent invocations on a miss may double-mint; that is harmless — FedEx
 * `client_credentials` tokens coexist and the worst-case mint volume stays far
 * below the endpoint's daily cap. No lock needed.
 */
export async function getFedexToken(): Promise<string> {
  const cached = await storage.get<{ token: string }>(TOKEN_KEY, { scope: 'connection' })
  if (cached) return cached.value.token

  const { token, expiresIn } = await mintToken()
  await storage.set(
    TOKEN_KEY,
    { token },
    { scope: 'connection', ttlSeconds: Math.max(60, expiresIn - SKEW_SECONDS) }
  )
  return token
}

/** Drop the cached token so the next call re-mints — used on a 401 from the API. */
export async function invalidateFedexToken(): Promise<void> {
  await storage.remove(TOKEN_KEY, { scope: 'connection' })
}
