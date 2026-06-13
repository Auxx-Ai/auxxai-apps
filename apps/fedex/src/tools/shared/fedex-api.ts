// src/tools/shared/fedex-api.ts

/**
 * FedEx Track API client (Basic Integrated Visibility — the free pull API).
 *
 * Surfaces SDK error classes the platform understands, and handles two FedEx
 * specifics:
 *  - 401 retry-once: a 401 invalidates the cached token, re-mints, and retries
 *    the request once; a second 401 → `ConnectionExpiredError`.
 *  - Per-number not-found is NOT an exception: FedEx returns per-number errors
 *    inside `completeTrackResults[].trackResults[].error` with a 200 envelope.
 *    The client returns the raw per-number results; the mapper decides found-ness.
 */

import {
  ConnectionExpiredError,
  InsufficientPermissionsError,
  InvalidInputError,
  RateLimitError,
  UpstreamServiceError,
} from '@auxx/sdk/server'
import { getFedexBaseUrl, getFedexToken, invalidateFedexToken } from './fedex-auth'

/** Loosely typed raw FedEx trackResult — the mapper narrows what it needs. */
export type RawTrackResult = Record<string, unknown> & {
  error?: { code?: string; message?: string }
  latestStatusDetail?: Record<string, unknown>
}

/** One entry of `output.completeTrackResults`. */
export interface NumberResult {
  trackingNumber: string
  trackResults: RawTrackResult[]
}

interface TrackingNumberInfo {
  trackingNumberInfo: { trackingNumber: string }
  shipDateBegin?: string
  shipDateEnd?: string
}

interface ReferenceLookup {
  reference: string
  referenceType: string
  accountNumber: string
  shipDateBegin: string
  shipDateEnd: string
}

interface TrackEnvelope {
  output?: {
    completeTrackResults?: Array<{ trackingNumber?: string; trackResults?: RawTrackResult[] }>
  }
}

function extractMessage(data: unknown): string | undefined {
  const errors = (data as { errors?: Array<{ message?: string }> })?.errors
  return Array.isArray(errors) && errors[0]?.message ? errors[0].message : undefined
}

async function fedexRequest<T>(path: string, body: unknown, allowRetry = true): Promise<T> {
  const base = await getFedexBaseUrl()
  const token = await getFedexToken()

  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-customer-transaction-id': crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new UpstreamServiceError(err instanceof Error ? err.message : 'FedEx request failed')
  }

  // 401 → invalidate + re-mint + retry once, then give up.
  if (response.status === 401 && allowRetry) {
    await invalidateFedexToken()
    return fedexRequest<T>(path, body, false)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) throw new ConnectionExpiredError('organization')
    if (response.status === 403) throw new InsufficientPermissionsError('organization')
    if (response.status === 429) {
      const ra = Number(response.headers.get('Retry-After'))
      throw new RateLimitError(Number.isFinite(ra) ? ra : undefined)
    }
    if (response.status >= 500) {
      throw new UpstreamServiceError(`FedEx error ${response.status}`, response.status)
    }
    if (response.status === 400 || response.status === 422) {
      throw new InvalidInputError(extractMessage(data) ?? 'FedEx rejected the request.')
    }
    throw new Error(`FedEx API error: ${response.status} ${response.statusText}`)
  }

  return data as T
}

function toNumberResults(data: TrackEnvelope): NumberResult[] {
  return (data.output?.completeTrackResults ?? []).map((r) => ({
    trackingNumber: r.trackingNumber ?? '',
    trackResults: r.trackResults ?? [],
  }))
}

/**
 * Track by tracking number — up to 30 numbers per call. The caller is
 * responsible for chunking to ≤30 (the trigger does; tools cap inputs at 30).
 */
export async function trackByNumbers(infos: TrackingNumberInfo[]): Promise<NumberResult[]> {
  const data = await fedexRequest<TrackEnvelope>('/track/v1/trackingnumbers', {
    includeDetailedScans: true,
    trackingInfo: infos,
  })
  return toNumberResults(data)
}

/** Track by your own reference (order/PO/invoice) within a ship-date window. */
export async function trackByReference(lookup: ReferenceLookup): Promise<NumberResult[]> {
  const data = await fedexRequest<TrackEnvelope>('/track/v1/referencenumbers', {
    includeDetailedScans: true,
    trackingInfo: [
      {
        shipDateBegin: lookup.shipDateBegin,
        shipDateEnd: lookup.shipDateEnd,
        referenceNumberInfo: {
          type: lookup.referenceType,
          value: lookup.reference,
          accountNumber: { value: lookup.accountNumber },
        },
      },
    ],
  })
  return toNumberResults(data)
}
