// src/payments.connector.server.ts

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorQuery,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { payoutSourceFields, processorSourceFields } from '@auxx/sdk/financial-source'
import { ConnectionExpiredError, InsufficientPermissionsError } from '@auxx/sdk/server'
import type { RawBalanceTransaction, RawPayout } from './blocks/shopify/shared/payments-api'
import {
  balanceEvidence,
  evidenceId,
  payoutEvidence,
} from './blocks/shopify/shared/payments-evidence'
import { getShopDomain, getShopifyToken } from './blocks/shopify/shared/shopify-api'
import { type ShopifyHttp, shopifyGraphql, shopifyHttp } from './graphql/client'
import type { GraphqlConnection } from './graphql/paged'
import {
  BALANCE_TRANSACTIONS_QUERY,
  type GqlBalanceTransaction,
  type GqlPayout,
  type PaymentsAccountData,
  PAYOUT_HEADERS_QUERY,
  PAYOUT_MEMBERS_QUERY,
  payoutMembersQuery,
  toRawBalanceTransaction,
  toRawPayout,
} from './graphql/payments'

class PaymentsThrottle extends Error {
  constructor(readonly retryAfterMs?: number) {
    super('Shopify Payments rate limit')
  }
}

/** Identity failures stop the scan; they never become a diagnostic membership record. */
class PaymentsAccountError extends Error {}

const fatal = (error: unknown) =>
  error instanceof PaymentsThrottle ||
  error instanceof PaymentsAccountError ||
  error instanceof InsufficientPermissionsError ||
  error instanceof ConnectionExpiredError

type Key = 'payouts' | 'balanceTransactions'

async function accountPage<K extends Key, Node>(
  http: ShopifyHttp,
  query: string,
  key: K,
  variables: Record<string, unknown>
) {
  const page = await shopifyGraphql<PaymentsAccountData<K, Node>>(http, query, variables)
  if (!page.ok) throw new PaymentsThrottle(page.retryAfterMs)
  const account = page.data.shopifyPaymentsAccount
  if (!account?.id?.startsWith('gid://shopify/ShopifyPaymentsAccount/'))
    throw new PaymentsAccountError(
      'Shopify Payments account identity is unavailable; verify the connected account and permissions'
    )
  return { accountId: account.id, connection: account[key] }
}

/** The page's nodes and the next endCursor, or undefined on the last page. */
function pageOf<Node>(connection: GraphqlConnection<Node> | undefined, key: Key) {
  if (!connection || !Array.isArray(connection.nodes))
    throw new Error(`Shopify Payments response has no ${key} collection`)
  if (!connection.pageInfo?.hasNextPage) return { rows: connection.nodes, next: undefined }
  const next = connection.pageInfo.endCursor
  if (!next) throw new Error('Shopify Payments returned an invalid next page cursor')
  return { rows: connection.nodes, next }
}

/** A non-object node stays as it arrived, so evidence rejects it with the raw body. */
function adaptRows(nodes: unknown[]): unknown[] {
  return nodes.map((node) =>
    node && typeof node === 'object' ? toRawBalanceTransaction(node as GqlBalanceTransaction) : node
  )
}

function bindAccount(cursor: PaymentsCursor, accountId: string): PaymentsCursor {
  if (cursor.accountId && cursor.accountId !== accountId)
    throw new PaymentsAccountError(
      'Shopify Payments merchant changed during acquisition; restart the scan'
    )
  return { ...cursor, accountId }
}

interface PaymentsCursor {
  version: 3
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

/** A v2 REST cursor, or any other legacy value, restarts the scan (plan D11). */
function resumeCursor(value: unknown, streamKey: string): PaymentsCursor | null {
  if (!value || typeof value !== 'object' || (value as PaymentsCursor).version !== 3) return null
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

const DAY_MS = 86_400_000

/** The period's bound as a UTC date, rounded outward so a whole-day filter never narrows it. */
function utcDate(iso: string, roundUp: boolean): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) throw new Error(`Shopify Payments: unparseable period bound "${iso}"`)
  const day = (roundUp ? Math.ceil(ms / DAY_MS) : Math.floor(ms / DAY_MS)) * DAY_MS
  return new Date(day).toISOString().slice(0, 10)
}

/** `query.period` as a whole-day search on `field`; `to` stays exclusive. */
function periodSearch(field: string, query: ConnectorQuery): string | null {
  const terms: string[] = []
  if (query.period?.from) terms.push(`${field}:>=${utcDate(query.period.from, false)}`)
  if (query.period?.to) terms.push(`${field}:<${utcDate(query.period.to, true)}`)
  return terms.length ? terms.join(' AND ') : null
}

/** Whether a balance row's `processed_at` falls in the period; an undated row is kept for evidence. */
function inPeriod(raw: unknown, query: ConnectorQuery): boolean {
  const at =
    raw && typeof raw === 'object'
      ? Date.parse(String((raw as RawBalanceTransaction).processed_at))
      : NaN
  if (Number.isNaN(at)) return true
  const { from, to } = query.period ?? {}
  return (!from || at >= Date.parse(from)) && (!to || at < Date.parse(to))
}

function continuation(cursor: PaymentsCursor, outerCursor?: string): { cursor?: PaymentsCursor } {
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
    : {}
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

function headerProjection(raw: RawPayout, adaptError?: string) {
  if (adaptError) return { payout: null, rejectionReason: adaptError }
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
  adaptError?: string
): ConnectorRecord {
  const raw = cursor.payout!
  let id: string
  try {
    if (adaptError) throw new Error(adaptError)
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
      ...headerProjection(raw, adaptError),
      raw,
      membership: { providerReady: raw?.status === 'paid', ...membership },
    }),
  }
}

/** Fetch one bounded source page. The platform owns cursor persistence and continuation. */
export async function fetchPaymentsStream(
  args: ConnectorExecuteArgs
): Promise<ConnectorFetchResult> {
  if (!getShopifyToken(args.connection) || !getShopDomain(args.connection?.metadata))
    throw new Error('Shopify Payments requires a connected Shopify store')
  const scopes = args.connection?.metadata?.scope
  if (typeof scopes === 'string' && scopes.trim()) {
    const granted = new Set(scopes.split(/[ ,]+/))
    const missing = ['read_shopify_payments_payouts', 'read_shopify_payments_accounts'].filter(
      (scope) => !granted.has(scope) && !granted.has('read_shopify_payments')
    )
    if (missing.length) throw new InsufficientPermissionsError('organization', missing)
  }
  const cursor = resumeCursor(args.cursor, args.streamKey)
  // Commit the acquisition identity BEFORE reading any financial facts. Retries use
  // the same identity; this timestamp is diagnostic, never a provider version.
  if (!cursor) {
    return {
      records: [],
      cursor: {
        version: 3,
        streamKey: args.streamKey,
        scanId: crypto.randomUUID(),
        startedAt: new Date().toISOString(),
        phase: args.streamKey === 'payout' ? 'headers' : 'balance',
        pageIndex: 0,
        headerIndex: 0,
      } satisfies PaymentsCursor,
    }
  }
  const http = shopifyHttp(args.connection)
  const shop = http.shopDomain
  try {
    // No `since`: provider processing dates are not update timestamps.
    if (cursor.phase === 'balance') {
      const { accountId, connection } = await accountPage<'balanceTransactions', unknown>(
        http,
        BALANCE_TRANSACTIONS_QUERY,
        'balanceTransactions',
        { after: cursor.outerCursor ?? null, query: periodSearch('processed_at', args.query) }
      )
      const bound = bindAccount(cursor, accountId)
      const result = pageOf(connection, 'balanceTransactions')
      const pageId = `${cursor.scanId}:${cursor.pageIndex}`
      // The search widens to whole days, so the exact period is re-applied to each row.
      const rows = adaptRows(result.rows).filter((raw) => inPeriod(raw, args.query))
      const records = rows.map((raw, index) => {
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
            sourceAccount: {
              providerKey: 'shopify_payments',
              externalAccountId: accountId,
              environment,
            },
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
      return result.next
        ? {
            records,
            cursor: { ...bound, outerCursor: result.next, pageIndex: cursor.pageIndex + 1 },
          }
        : { records }
    }
    if (cursor.phase === 'headers') {
      const { accountId, connection } = await accountPage<'payouts', GqlPayout>(
        http,
        PAYOUT_HEADERS_QUERY,
        'payouts',
        { after: cursor.outerCursor ?? null, query: periodSearch('issued_at', args.query) }
      )
      const bound = bindAccount(cursor, accountId)
      const result = pageOf(connection, 'payouts')
      if (result.rows.length > 1)
        throw new Error('Shopify Payments exceeded the requested payout page size')
      if (result.next && result.next === cursor.outerCursor)
        throw new Error('Shopify Payments repeated a payout page cursor')
      const node = result.rows[0]
      if (!node) return { records: [], ...continuation(bound, result.next) }
      let raw: RawPayout
      let adaptError: string | undefined
      try {
        raw = toRawPayout(node)
      } catch (error) {
        raw = node as unknown as RawPayout
        adaptError = error instanceof Error ? error.message : 'Invalid payout'
      }
      const next: PaymentsCursor = {
        ...bound,
        phase: 'members',
        payout: raw,
        outerCursor: result.next,
        memberCursor: undefined,
        pageIndex: 0,
      }
      let hasSourceIdentity = !adaptError
      try {
        evidenceId(raw?.id)
      } catch {
        hasSourceIdentity = false
      }
      return {
        records: [
          payoutRecord(
            next,
            accountId,
            {
              complete: false,
              page: null,
              entries: [],
              rejections: [],
              rawRows: [],
              reason: 'Payout membership acquisition is pending',
            },
            adaptError
          ),
        ],
        ...(hasSourceIdentity ? { cursor: next } : continuation(bound, result.next)),
      }
    }
    if (!cursor.payout) throw new Error('Payout membership cursor has no payout header')
    if (!cursor.accountId) throw new Error('Payout membership cursor has no processor account')
    const payoutId = evidenceId(cursor.payout.id)
    try {
      const { accountId, connection } = await accountPage<'balanceTransactions', unknown>(
        http,
        PAYOUT_MEMBERS_QUERY,
        'balanceTransactions',
        { after: cursor.memberCursor ?? null, query: payoutMembersQuery(payoutId) }
      )
      const bound = bindAccount(cursor, accountId)
      const result = pageOf(connection, 'balanceTransactions')
      const projected = projectRows(adaptRows(result.rows), shop, payoutId)
      const repeated = !!result.next && result.next === cursor.memberCursor
      const reason = repeated
        ? 'Shopify Payments repeated a membership page cursor'
        : projected.rejections.length
          ? 'Payout membership contains rejected source rows'
          : null
      return {
        records: [
          payoutRecord(bound, accountId, {
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
        ...(result.next && !repeated
          ? { cursor: { ...bound, memberCursor: result.next, pageIndex: cursor.pageIndex + 1 } }
          : continuation(bound, cursor.outerCursor)),
      }
    } catch (error) {
      if (fatal(error)) throw error
      return {
        records: [
          payoutRecord(cursor, cursor.accountId, {
            complete: false,
            page: null,
            entries: [],
            rejections: [],
            rawRows: [],
            reason: error instanceof Error ? error.message : 'Payout membership is unavailable',
          }),
        ],
        // A failed or expired traversal stays incomplete. A later scan starts a new acquisition.
        ...continuation(cursor, cursor.outerCursor),
      }
    }
  } catch (error) {
    // The platform retries this same cursor after the wait.
    if (error instanceof PaymentsThrottle)
      return { records: [], rateLimited: { retryAfterMs: error.retryAfterMs } }
    throw error
  }
}
