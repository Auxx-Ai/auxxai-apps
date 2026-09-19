// src/tools/shared/settlements.ts

// The one implementation of "read a page of Authorize.net settlements", shared by the
// connector and the read tools. Readers are tolerant because the reference documents two
// serializations of the same payload and no live probe has settled which one arrives.

import {
  type AuthorizeNetBatch,
  type AuthorizeNetBatchStatistic,
  type AuthorizeNetTransactionDetail,
  type AuthorizeNetTransactionSummary,
  batchNetAmount,
} from '../../settlement-evidence'
import { authorizeNetApi } from './authorize-net-api'
import type { AuthorizeNetCredentials } from './connection'

export type {
  AuthorizeNetBatch,
  AuthorizeNetBatchStatistic,
  AuthorizeNetTransactionDetail,
  AuthorizeNetTransactionSummary,
}
export { batchNetAmount }

/** Cap on `getSettledBatchList`'s date range — recalled, not proven. */
export const AUTHORIZE_NET_MAX_WINDOW_DAYS = 31

/** The gateway's own maximum `paging.limit`. */
export const AUTHORIZE_NET_PAGE_LIMIT = 1000

/** 250, not the gateway's maximum: the platform caps a persisted membership page there. */
export const AUTHORIZE_NET_MEMBER_PAGE_LIMIT = 250

const DAY_MS = 86_400_000
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** One `firstSettlementDate` / `lastSettlementDate` pair, both ISO timestamps. */
export interface SettlementWindow {
  first: string
  last: string
}

function boundary(value: string, endOfDay: boolean): number {
  const text = DATE_ONLY.test(value) ? `${value}T${endOfDay ? '23:59:59' : '00:00:00'}Z` : value
  const ms = Date.parse(text)
  if (!Number.isFinite(ms)) throw new Error(`Invalid Authorize.net settlement date: ${value}`)
  return ms
}

const isoSecond = (ms: number): string => `${new Date(ms).toISOString().slice(0, 19)}Z`

/** Split `[startDate, endDate]` into forward-walking windows no longer than `maxDays`. */
export function settlementWindows(
  startDate: string,
  endDate: string,
  maxDays: number = AUTHORIZE_NET_MAX_WINDOW_DAYS
): SettlementWindow[] {
  if (!Number.isSafeInteger(maxDays) || maxDays < 1) {
    throw new Error('Authorize.net settlement window must span at least one day')
  }
  const endMs = boundary(endDate, true)
  const windows: SettlementWindow[] = []
  for (let cursor = boundary(startDate, false); cursor <= endMs;) {
    const last = Math.min(cursor + maxDays * DAY_MS - 1000, endMs)
    windows.push({ first: isoSecond(cursor), last: isoSecond(last) })
    cursor = last + 1000
  }
  return windows
}

function asArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    const nested = (value as Record<string, unknown>)[key]
    if (Array.isArray(nested)) return nested as T[]
    // A single-element collection is serialized as the bare object.
    return [value as T]
  }
  return []
}

/** `totalNumInResultSet` arrives as a string on some surfaces and a number on others. */
function asCount(value: unknown): number {
  const count = typeof value === 'string' ? Number(value) : value
  return typeof count === 'number' && Number.isFinite(count) && count >= 0 ? Math.trunc(count) : 0
}

function normaliseBatch(raw: Record<string, unknown>): AuthorizeNetBatch {
  const statistics = raw.statistics
  return {
    ...raw,
    statistics:
      statistics === undefined
        ? undefined
        : asArray<AuthorizeNetBatchStatistic>(statistics, 'statistic'),
  } as AuthorizeNetBatch
}

/** `getSettledBatchListRequest` for one window — the payout headers. */
export async function fetchSettledBatches(input: {
  credentials: AuthorizeNetCredentials
  first: string
  last: string
  includeStatistics?: boolean
  fetchImpl?: typeof fetch
}): Promise<AuthorizeNetBatch[]> {
  const body = await authorizeNetApi({
    credentials: input.credentials,
    request: 'getSettledBatchListRequest',
    body: {
      includeStatistics: input.includeStatistics ?? true,
      firstSettlementDate: input.first,
      lastSettlementDate: input.last,
    },
    fetchImpl: input.fetchImpl,
  })
  // A window with no settled batches omits `batchList` entirely; that is not malformed.
  return asArray<Record<string, unknown>>(body.batchList, 'batch').map(normaliseBatch)
}

/**
 * `getTransactionListRequest` for one batch. `offset` is 1-based, so a caller looping on
 * it compares `offset - 1 + returned` against the returned total.
 */
export async function fetchBatchTransactions(input: {
  credentials: AuthorizeNetCredentials
  batchId: string
  limit?: number
  offset?: number
  fetchImpl?: typeof fetch
}): Promise<{ transactions: AuthorizeNetTransactionSummary[]; total: number }> {
  const limit = Math.min(input.limit ?? AUTHORIZE_NET_MEMBER_PAGE_LIMIT, AUTHORIZE_NET_PAGE_LIMIT)
  const offset = input.offset ?? 1
  if (!Number.isSafeInteger(offset) || offset < 1) {
    throw new Error('Authorize.net transaction paging offset is 1-based')
  }
  const body = await authorizeNetApi({
    credentials: input.credentials,
    request: 'getTransactionListRequest',
    body: {
      batchId: input.batchId,
      sorting: { orderBy: 'submitTimeUTC', orderDescending: false },
      paging: { limit: String(limit), offset: String(offset) },
    },
    fetchImpl: input.fetchImpl,
  })
  return {
    transactions: asArray<AuthorizeNetTransactionSummary>(body.transactions, 'transaction'),
    total: asCount(body.totalNumInResultSet),
  }
}

/** `getTransactionDetailsRequest` — the only surface that names `transactionType`. */
export async function fetchTransactionDetails(input: {
  credentials: AuthorizeNetCredentials
  transId: string
  fetchImpl?: typeof fetch
}): Promise<AuthorizeNetTransactionDetail> {
  const body = await authorizeNetApi({
    credentials: input.credentials,
    request: 'getTransactionDetailsRequest',
    body: { transId: input.transId },
    fetchImpl: input.fetchImpl,
  })
  const transaction = body.transaction
  if (!transaction || typeof transaction !== 'object') {
    throw new Error(`Authorize.net returned no detail for transaction ${input.transId}`)
  }
  return transaction as AuthorizeNetTransactionDetail
}

/** `getUnsettledTransactionListRequest` — captured but not yet in a settled batch. */
export async function fetchUnsettledTransactions(input: {
  credentials: AuthorizeNetCredentials
  limit?: number
  offset?: number
  fetchImpl?: typeof fetch
}): Promise<{ transactions: AuthorizeNetTransactionSummary[]; total: number }> {
  const limit = Math.min(input.limit ?? AUTHORIZE_NET_MEMBER_PAGE_LIMIT, AUTHORIZE_NET_PAGE_LIMIT)
  const offset = input.offset ?? 1
  if (!Number.isSafeInteger(offset) || offset < 1) {
    throw new Error('Authorize.net transaction paging offset is 1-based')
  }
  const body = await authorizeNetApi({
    credentials: input.credentials,
    request: 'getUnsettledTransactionListRequest',
    body: {
      sorting: { orderBy: 'submitTimeUTC', orderDescending: true },
      paging: { limit: String(limit), offset: String(offset) },
    },
    fetchImpl: input.fetchImpl,
  })
  return {
    transactions: asArray<AuthorizeNetTransactionSummary>(body.transactions, 'transaction'),
    total: asCount(body.totalNumInResultSet),
  }
}

/**
 * `getMerchantDetailsRequest` — the account identity and its currencies. `gatewayId` is
 * null rather than fabricated; the caller falls back to the API Login ID (build plan §3.1).
 */
export async function fetchMerchantDetails(input: {
  credentials: AuthorizeNetCredentials
  fetchImpl?: typeof fetch
}): Promise<{
  gatewayId: string | null
  name: string | null
  currencies: string[]
  raw: Record<string, unknown>
}> {
  const body = await authorizeNetApi({
    credentials: input.credentials,
    request: 'getMerchantDetailsRequest',
    fetchImpl: input.fetchImpl,
  })
  const text = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : null
  return {
    gatewayId: text(body.gatewayId),
    name: text(body.merchantName),
    currencies: Array.isArray(body.currencies)
      ? body.currencies.filter((entry): entry is string => typeof entry === 'string')
      : [],
    raw: body,
  }
}
