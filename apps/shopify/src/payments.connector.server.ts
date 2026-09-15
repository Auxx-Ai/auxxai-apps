// src/payments.connector.server.ts

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { InsufficientPermissionsError } from '@auxx/sdk/server'
import type { RawBalanceTransaction, RawPayout } from './blocks/shopify/shared/payments-api'
import {
  balanceEvidence,
  evidenceId,
  payoutEvidence,
} from './blocks/shopify/shared/payments-evidence'
import { getShopDomain, getShopifyToken } from './blocks/shopify/shared/shopify-api'
import { payoutSourceFields, processorSourceFields } from './financial-source-fields'

// Pinned supported version. Existing order/product streams retain their independent version.
const PAYMENTS_API_VERSION = '2026-04'
const BALANCE_PATH = '/shopify_payments/balance/transactions.json'

class PaymentsThrottle extends Error {
  constructor(readonly retryAfterMs?: number) {
    super('Shopify Payments rate limit')
  }
}

interface PaymentsHttp {
  origin: string
  headers: Record<string, string>
}

async function readResponse(
  http: PaymentsHttp,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(`${http.origin}${path}`, {
    ...init,
    headers: http.headers,
    signal: AbortSignal.timeout(10_000),
  })
  if (response.status === 429) {
    const retry = response.headers.get('Retry-After')
    throw new PaymentsThrottle(retry === null ? undefined : Number(retry) * 1000)
  }
  if (!response.ok) throw new Error(`Shopify Payments API responded ${response.status}`)
  return response
}

/** Read only the page token, never forward the token-bearing auth header to a Link URL. */
function nextPage(response: Response): string | undefined {
  const link = response.headers.get('Link')
  if (!link || !/rel="next"/.test(link)) return undefined
  const match = link.match(/<([^>]+)>;\s*rel="next"/)
  const cursor = match ? new URL(match[1]!).searchParams.get('page_info') : null
  if (!cursor) throw new Error('Shopify Payments returned an invalid next page link')
  return cursor
}

async function page<T>(http: PaymentsHttp, path: string, root: string, params: URLSearchParams) {
  const response = await readResponse(http, `${path}?${params}`)
  const body = (await response.json()) as Record<string, unknown>
  if (!Array.isArray(body[root]))
    throw new Error(`Shopify Payments response has no ${root} collection`)
  return { rows: body[root] as T[], next: nextPage(response) }
}

async function processorAccountId(http: PaymentsHttp): Promise<string> {
  const response = await readResponse(http, '/graphql.json', {
    method: 'POST',
    body: JSON.stringify({
      query: 'query ShopifySettlementIdentity { shopifyPaymentsAccount { id } }',
    }),
  })
  const body = (await response.json()) as {
    errors?: { message: string; extensions?: { code?: string } }[]
    data?: { shopifyPaymentsAccount?: { id?: string } | null }
  }
  if (body.errors?.some((error) => error.extensions?.code === 'THROTTLED')) {
    throw new PaymentsThrottle()
  }
  if (body.errors?.length)
    throw new Error(
      `Shopify Payments account lookup: ${body.errors.map((error) => error.message).join('; ')}`,
    )
  const id = body.data?.shopifyPaymentsAccount?.id
  if (!id?.startsWith('gid://shopify/ShopifyPaymentsAccount/')) {
    throw new Error(
      'Shopify Payments account identity is unavailable; verify the connected account and permissions',
    )
  }
  return id
}

interface PaymentsCursor {
  version: 2
  streamKey: string
  scanId: string
  startedAt: string
  phase: 'headers' | 'members' | 'balance'
  accountId?: string
  outerCursor?: string
  memberCursor?: string
  pageIndex: number
  headerIndex: number
  payout?: RawPayout
}

function resumeCursor(value: unknown, streamKey: string): PaymentsCursor | null {
  if (value == null) return null
  if (typeof value !== 'object' || (value as PaymentsCursor).version !== 2)
    throw new Error('Restart the Shopify Payments scan to replace its legacy cursor')
  const cursor = value as PaymentsCursor
  if (
    cursor.streamKey !== streamKey ||
    !cursor.scanId ||
    !cursor.startedAt ||
    !Number.isSafeInteger(cursor.pageIndex) ||
    cursor.pageIndex < 0 ||
    !['headers', 'members', 'balance'].includes(cursor.phase)
  )
    throw new Error('Invalid Shopify Payments acquisition cursor')
  return cursor
}

function continuation(cursor: PaymentsCursor, outerCursor?: string) {
  return outerCursor
    ? {
        cursor: {
          ...cursor,
          phase: 'headers',
          outerCursor,
          memberCursor: undefined,
          payout: undefined,
          pageIndex: 0,
          headerIndex: cursor.headerIndex + 1,
        },
      }
    : { backfillComplete: true }
}

function projectRows(rows: unknown[], shop: string, payoutId?: string) {
  const entries: (ReturnType<typeof balanceEvidence> & {
    sourceReference: {
      sourceAccount: { providerKey: string; externalAccountId: string; environment: string }
      objectType: string
      externalId: string
      componentKey: string
    } | null
  })[] = []
  const rejections: { index: number; raw: unknown; reason: string }[] = []
  const seen = new Map<string, ReturnType<typeof balanceEvidence>>()
  rows.forEach((raw, index) => {
    try {
      if (!raw || typeof raw !== 'object') throw new Error('Invalid balance transaction row')
      const entry = balanceEvidence(raw as RawBalanceTransaction)
      if (payoutId && entry.payoutId !== payoutId)
        throw new Error(`Transaction ${entry.id} belongs to another payout`)
      if (payoutId && (raw as RawBalanceTransaction).test)
        throw new Error(`Test transaction ${entry.id} cannot belong to a live payout`)
      const previous = seen.get(entry.id)
      if (previous && JSON.stringify(previous) !== JSON.stringify(entry))
        throw new Error(`Transaction ${entry.id} changed within a payout page`)
      seen.set(entry.id, entry)
      entries.push({
        ...entry,
        sourceReference: entry.sourceTransactionId
          ? {
              sourceAccount: {
                providerKey: 'shopify',
                externalAccountId: shop,
                environment: (raw as RawBalanceTransaction).test ? 'test' : 'live',
              },
              objectType: 'order_transaction',
              externalId: entry.sourceTransactionId,
              componentKey: '',
            }
          : null,
      })
    } catch (error) {
      rejections.push({
        index,
        raw,
        reason: error instanceof Error ? error.message : 'Invalid transaction',
      })
    }
  })
  return { entries, rejections, rawRows: rows }
}

function headerProjection(raw: RawPayout) {
  try {
    return { payout: payoutEvidence(raw), rejectionReason: null }
  } catch (error) {
    return {
      payout: null,
      rejectionReason: error instanceof Error ? error.message : 'Invalid payout',
    }
  }
}

function payoutRecord(
  cursor: PaymentsCursor,
  externalAccountId: string,
  membership: Record<string, unknown>,
): ConnectorRecord {
  const raw = cursor.payout!
  let id: string
  try {
    id = evidenceId(raw?.id)
  } catch {
    id = `rejected:${cursor.scanId}:header:${cursor.headerIndex}`
  }
  return {
    streamKey: 'payout',
    externalId: id,
    displayName: `Shopify payout ${id}`,
    fields: payoutSourceFields({
      externalId: id,
      sourceAccount: { providerKey: 'shopify_payments', externalAccountId, environment: 'live' },
      acquisition: { id: `${cursor.scanId}:${id}`, startedAt: cursor.startedAt },
      ...headerProjection(raw),
      raw,
      membership: { providerReady: raw?.status === 'paid', ...membership },
    }),
  }
}

/** Fetch one bounded source page. The platform owns cursor persistence and continuation. */
export async function fetchPaymentsStream(
  args: ConnectorExecuteArgs,
): Promise<ConnectorFetchResult> {
  const token = getShopifyToken(args.connection)
  const shop = getShopDomain(args.connection?.metadata)
  if (!token || !shop) throw new Error('Shopify Payments requires a connected Shopify store')
  const scopes = args.connection?.metadata?.scope
  if (typeof scopes === 'string' && scopes.trim()) {
    const granted = new Set(scopes.split(/[ ,]+/))
    const missing = ['read_shopify_payments_payouts', 'read_shopify_payments_accounts'].filter(
      (scope) => !granted.has(scope) && !granted.has('read_shopify_payments'),
    )
    if (missing.length) throw new InsufficientPermissionsError('organization', missing)
  }
  const cursor = resumeCursor(args.state.cursor, args.streamKey)
  // Commit the acquisition identity BEFORE reading any financial facts. Retries use
  // the same identity; this timestamp is diagnostic, never a provider version.
  if (!cursor)
    return {
      records: [],
      nextState: {
        cursor: {
          version: 2,
          streamKey: args.streamKey,
          scanId: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
          phase: args.streamKey === 'payout' ? 'headers' : 'balance',
          pageIndex: 0,
          headerIndex: 0,
        },
      },
    }
  const http: PaymentsHttp = {
    origin: `https://${shop}/admin/api/${PAYMENTS_API_VERSION}`,
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
  }
  try {
    const externalAccountId = await processorAccountId(http)
    if (cursor.accountId && cursor.accountId !== externalAccountId)
      throw new Error('Shopify Payments merchant changed during acquisition; restart the scan')
    const bound = { ...cursor, accountId: externalAccountId }
    // No updatedSince: provider processing dates are not update timestamps.
    if (cursor.phase === 'balance') {
      const params = new URLSearchParams({ limit: '250' })
      if (cursor.outerCursor) params.set('page_info', cursor.outerCursor)
      const result = await page<unknown>(http, BALANCE_PATH, 'transactions', params)
      const pageId = `${cursor.scanId}:${cursor.pageIndex}`
      const records = result.rows.map((raw, index) => {
        const projected = projectRows([raw], shop)
        const entry = projected.entries[0] ?? null
        const environment =
          raw && typeof raw === 'object' && (raw as RawBalanceTransaction).test ? 'test' : 'live'
        return {
          streamKey: 'balance_transaction',
          externalId: entry?.id ?? `rejected:${pageId}:${index}`,
          displayName: `Shopify balance transaction ${entry?.id ?? 'unresolved'}`,
          fields: processorSourceFields({
            externalId: entry?.id ?? `rejected:${pageId}:${index}`,
            sourceAccount: { providerKey: 'shopify_payments', externalAccountId, environment },
            acquisition: { id: cursor.scanId, startedAt: cursor.startedAt },
            page: { id: pageId, index: cursor.pageIndex, rowIndex: index },
            entry,
            raw,
            rejectionReason: projected.rejections[0]?.reason ?? null,
          }),
        }
      })
      if (result.next && result.next === cursor.outerCursor)
        throw new Error('Shopify Payments repeated a balance page cursor')
      return {
        records,
        nextState: result.next
          ? {
              cursor: {
                ...bound,
                outerCursor: result.next,
                pageIndex: cursor.pageIndex + 1,
              },
            }
          : { backfillComplete: true },
      }
    }
    if (cursor.phase === 'headers') {
      const params = new URLSearchParams({ limit: '1' })
      if (cursor.outerCursor) params.set('page_info', cursor.outerCursor)
      else if (args.config?.payoutHistoryStartDate) {
        const start = String(args.config.payoutHistoryStartDate)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(start))
          throw new Error('Payout history start must be YYYY-MM-DD')
        params.set('date_min', start)
      }
      const result = await page<RawPayout>(
        http,
        '/shopify_payments/payouts.json',
        'payouts',
        params,
      )
      if (result.rows.length > 1)
        throw new Error('Shopify Payments exceeded the requested payout page size')
      if (result.next && result.next === cursor.outerCursor)
        throw new Error('Shopify Payments repeated a payout page cursor')
      const raw = result.rows[0]
      if (!result.rows.length) return { records: [], nextState: continuation(bound, result.next) }
      const next: PaymentsCursor = {
        ...bound,
        phase: 'members',
        payout: raw!,
        outerCursor: result.next,
        memberCursor: undefined,
        pageIndex: 0,
      }
      let hasSourceIdentity = true
      try {
        evidenceId(raw?.id)
      } catch {
        hasSourceIdentity = false
      }
      return {
        records: [
          payoutRecord(next, externalAccountId, {
            complete: false,
            page: null,
            entries: [],
            rejections: [],
            rawRows: [],
            reason: 'Payout membership acquisition is pending',
          }),
        ],
        nextState: hasSourceIdentity ? { cursor: next } : continuation(bound, result.next),
      }
    }
    if (!cursor.payout) throw new Error('Payout membership cursor has no payout header')
    const payoutId = evidenceId(cursor.payout.id)
    try {
      const params = new URLSearchParams({ limit: '250' })
      if (cursor.memberCursor) params.set('page_info', cursor.memberCursor)
      else params.set('payout_id', payoutId)
      const result = await page<unknown>(http, BALANCE_PATH, 'transactions', params)
      const projected = projectRows(result.rows, shop, payoutId)
      const repeated = !!result.next && result.next === cursor.memberCursor
      const reason = repeated
        ? 'Shopify Payments repeated a membership page cursor'
        : projected.rejections.length
          ? 'Payout membership contains rejected source rows'
          : null
      return {
        records: [
          payoutRecord(bound, externalAccountId, {
            // Terminal traversal is only a candidate; the domain verifies the full stored chain.
            complete: !result.next && !reason,
            reason,
            page: {
              id: `${cursor.scanId}:${payoutId}:${cursor.pageIndex}`,
              index: cursor.pageIndex,
              requestCursor: cursor.memberCursor ?? null,
              nextCursor: result.next ?? null,
              terminal: !result.next,
            },
            ...projected,
          }),
        ],
        nextState:
          result.next && !repeated
            ? { cursor: { ...bound, memberCursor: result.next, pageIndex: cursor.pageIndex + 1 } }
            : continuation(bound, cursor.outerCursor),
      }
    } catch (error) {
      if (error instanceof PaymentsThrottle) throw error
      return {
        records: [
          payoutRecord(bound, externalAccountId, {
            complete: false,
            page: null,
            entries: [],
            rejections: [],
            rawRows: [],
            reason: error instanceof Error ? error.message : 'Payout membership is unavailable',
          }),
        ],
        // A failed or expired traversal stays incomplete. A later scan starts a new acquisition.
        nextState: continuation(bound, cursor.outerCursor),
      }
    }
  } catch (error) {
    if (error instanceof PaymentsThrottle)
      return {
        records: [],
        nextState: { cursor },
        rateLimited: { retryAfterMs: error.retryAfterMs },
      }
    throw error
  }
}
