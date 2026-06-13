// src/tools/shared/ups-api.ts

/**
 * UPS Track API client (Tracking v1 — the free pull API).
 *
 * UPS has no batch endpoint: each tracking number is a separate
 * `GET /api/track/v1/details/{inquiryNumber}`. The client fans out with bounded
 * concurrency so a 30-number call stays inside the tool timeout.
 *
 * Two UPS specifics the client owns:
 *  - Auth is platform-managed (`oauth2-code`): the bearer token lives on the
 *    connection and the platform refreshes it lazily, so a 401 is a hard
 *    `ConnectionExpiredError` (no app-side re-mint).
 *  - "Tracking Information Not Found" is NOT an exception. An unknown / not-yet-
 *    scanned number (HTTP 404 with the UPS error envelope) becomes a
 *    discriminated `{ found: false }` result so an agent can answer "no info
 *    yet" without the tool erroring. All other non-2xx map to SDK error classes.
 */

import {
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  RateLimitError,
  UpstreamServiceError,
  getOrganizationSetting,
} from '@auxx/sdk/server'
import { getUpsConnection } from './connection'

const PROD_BASE = 'https://onlinetools.ups.com'
const CIE_BASE = 'https://wwwcie.ups.com'

/** How many tracking GETs to run at once. 30 numbers ≈ 6 waves. */
const CONCURRENCY = 5

/** Loosely typed raw UPS package — the mapper narrows what it needs. */
export type RawPackage = Record<string, unknown>

export interface UpsTrackResult {
  trackingNumber: string
  /** False when UPS has no info for this number yet (HTTP 404 / not-found envelope). */
  found: boolean
  /** The first package of the matching shipment, or null when not found. */
  pkg: RawPackage | null
}

export interface UpsTrackSettled extends UpsTrackResult {
  /** True when the lookup threw (provider/network error) — the poll skips it and diffs next time. */
  error: boolean
}

export interface UpsTrackOptions {
  returnSignature?: boolean
  returnPod?: boolean
}

interface TrackEnvelope {
  trackResponse?: {
    shipment?: Array<{ package?: RawPackage[] }>
  }
}

/**
 * Base URL for all UPS API calls. CIE (`wwwcie.ups.com`) when the org enables
 * the `useTestEnvironment` setting; production otherwise. The OAuth connection
 * always points at production — CIE only changes where API calls go.
 */
export async function getUpsBaseUrl(): Promise<string> {
  const useTest = await getOrganizationSetting<boolean>('useTestEnvironment')
  return useTest ? CIE_BASE : PROD_BASE
}

/** UPS transId must be ≤ 32 chars — a hyphenless UUID is exactly 32 hex chars. */
function transId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

function extractMessage(data: unknown): string | undefined {
  const errors = (data as { response?: { errors?: Array<{ message?: string }> } })?.response?.errors
  return Array.isArray(errors) && errors[0]?.message ? errors[0].message : undefined
}

/** UPS sends `10429` as the rate-limit error code (sometimes without a 429 status). */
function isRateLimited(data: unknown): boolean {
  const errors = (data as { response?: { errors?: Array<{ code?: string }> } })?.response?.errors
  return Array.isArray(errors) && errors.some((e) => e.code === '10429')
}

/** Track a single number. Returns `{ found: false }` on a not-found, throws otherwise. */
async function trackOne(
  base: string,
  token: string,
  trackingNumber: string,
  opts: UpsTrackOptions
): Promise<UpsTrackResult> {
  const url = new URL(`${base}/api/track/v1/details/${encodeURIComponent(trackingNumber)}`)
  url.searchParams.set('locale', 'en_US')
  url.searchParams.set('returnMilestones', 'false')
  if (opts.returnSignature) url.searchParams.set('returnSignature', 'true')
  if (opts.returnPod) url.searchParams.set('returnPOD', 'true')

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        transId: transId(),
        transactionSrc: 'auxx',
      },
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'UPS request failed')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // Not found is a normal agent-facing answer, never an exception.
    if (response.status === 404) return { trackingNumber, found: false, pkg: null }
    if (response.status === 401) throw new ConnectionExpiredError('organization')
    if (response.status === 403) throw new InsufficientPermissionsError('organization')
    if (response.status === 429 || isRateLimited(data)) {
      // UPS sends no Retry-After — the platform's backoff owns the wait.
      throw new RateLimitError(undefined)
    }
    if (response.status >= 500) {
      throw new UpstreamServiceError(`UPS error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) {
      throw new InvalidInputError(extractMessage(data) ?? 'UPS rejected the request.')
    }
    throw new Error(`UPS API error: ${response.status} ${response.statusText}`)
  }

  if (isRateLimited(data)) throw new RateLimitError(undefined)

  const pkg = (data as TrackEnvelope).trackResponse?.shipment?.[0]?.package?.[0] ?? null
  return { trackingNumber, found: pkg != null, pkg }
}

/** Run tasks with bounded concurrency, preserving input order. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/**
 * Track several numbers at once. Fans out one GET per number with bounded
 * concurrency. Errors propagate (the caller decides tolerance); not-found
 * numbers come back as `{ found: false }`.
 */
export async function trackNumbers(
  trackingNumbers: string[],
  opts: UpsTrackOptions = {}
): Promise<UpsTrackResult[]> {
  const base = await getUpsBaseUrl()
  const { token } = getUpsConnection()
  return pool(trackingNumbers, CONCURRENCY, (n) => trackOne(base, token, n, opts))
}

/**
 * Like {@link trackNumbers} but per-number error tolerant: a number whose
 * lookup throws comes back as `{ error: true, found: false }` instead of
 * rejecting the whole batch. Used by the polling trigger so one failing number
 * never kills the schedule.
 */
export async function trackNumbersSettled(
  trackingNumbers: string[],
  opts: UpsTrackOptions = {}
): Promise<UpsTrackSettled[]> {
  const base = await getUpsBaseUrl()
  const { token } = getUpsConnection()
  return pool(trackingNumbers, CONCURRENCY, async (n) => {
    try {
      const r = await trackOne(base, token, n, opts)
      return { ...r, error: false }
    } catch {
      return { trackingNumber: n, found: false, pkg: null, error: true }
    }
  })
}
