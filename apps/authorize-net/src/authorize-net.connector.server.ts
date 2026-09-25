// src/authorize-net.connector.server.ts

// One page per `execute`; the platform drives the loop. `getSettledBatchList` accepts a
// bounded date range (31 days, recalled not proven), so `query.period` is walked as
// windows computed from its `from`.

import type {
  ConnectorExecuteArgs,
  ConnectorFetchResult,
  ConnectorQuery,
  ConnectorRecord,
} from '@auxx/sdk/data-connectors'
import { payoutSourceFields } from '@auxx/sdk/financial-source'
import { RateLimitError } from '@auxx/sdk/server'
import {
  type AuthorizeNetBatch,
  type AuthorizeNetTransactionSummary,
  authorizeNetId,
  payoutEvidence,
  processorEvidence,
} from './settlement-evidence'
import {
  type AuthorizeNetCredentials,
  type AuthorizeNetEnvironment,
  authorizeNetCredentialsFrom,
} from './tools/shared/connection'
import {
  AUTHORIZE_NET_MAX_WINDOW_DAYS,
  AUTHORIZE_NET_MEMBER_PAGE_LIMIT,
  fetchBatchTransactions,
  fetchMerchantDetails,
  fetchSettledBatches,
  settlementWindows,
} from './tools/shared/settlements'

/** First member of every `sourceKey` tuple this connector writes. */
export const AUTHORIZE_NET_PROVIDER_KEY = 'authorize_net'

interface AuthorizeNetCursor {
  version: 1
  streamKey: string
  scanId: string
  startedAt: string
  phase: 'headers' | 'members'
  /** The gateway id (or API Login ID) the scan started against. A change aborts it. */
  accountId: string
  /** The book the scan started against. Part of every `sourceKey` it writes. */
  environment: AuthorizeNetEnvironment
  /** `getMerchantDetails().currencies[0]`, or undefined for the USD default. */
  currency?: string
  /** Which window of {@link settlementWindows} the header phase is on. */
  windowIndex: number
  /** The batches that window returned, awaiting membership. */
  batches?: AuthorizeNetBatch[]
  batchIndex: number
  /** 1-based member offset within the current batch. */
  offset: number
  pageIndex: number
}

/** The query's period as settlement windows; `to` is exclusive, so the last second before it. */
function periodWindows(query: ConnectorQuery): { first: string; last: string }[] {
  const from = query.period?.from
  // The batch list has no "everything" call, only bounded windows walked from a start.
  if (!from) {
    throw new Error(
      'Authorize.net needs a start date to list settlements: set "Import history from" on the connector'
    )
  }
  const to = query.period?.to
  const end = to ? new Date(Date.parse(to) - 1000).toISOString() : new Date().toISOString()
  return settlementWindows(from, end, AUTHORIZE_NET_MAX_WINDOW_DAYS)
}

function resumeCursor(value: unknown, streamKey: string): AuthorizeNetCursor | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'object' || (value as AuthorizeNetCursor).version !== 1) {
    throw new Error('Restart the Authorize.net settlement scan to replace its incompatible cursor')
  }
  const cursor = value as AuthorizeNetCursor
  if (
    cursor.streamKey !== streamKey ||
    !cursor.scanId ||
    !cursor.startedAt ||
    !cursor.accountId ||
    !['live', 'test'].includes(cursor.environment) ||
    !Number.isSafeInteger(cursor.windowIndex) ||
    cursor.windowIndex < 0 ||
    !Number.isSafeInteger(cursor.batchIndex) ||
    cursor.batchIndex < 0 ||
    !Number.isSafeInteger(cursor.offset) ||
    cursor.offset < 1 ||
    !Number.isSafeInteger(cursor.pageIndex) ||
    cursor.pageIndex < 0 ||
    !['headers', 'members'].includes(cursor.phase)
  ) {
    throw new Error('Invalid Authorize.net acquisition cursor')
  }
  return cursor
}

/**
 * The stable upstream account identity: the gateway id, else the API Login ID. A
 * failed call falls back rather than throwing — the reporting toggle can gate it.
 */
async function resolveAccount(
  credentials: AuthorizeNetCredentials
): Promise<{ accountId: string; currency?: string }> {
  try {
    const details = await fetchMerchantDetails({ credentials })
    return {
      accountId: details.gatewayId ?? credentials.apiLoginId,
      currency: details.currencies[0],
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error
    return { accountId: credentials.apiLoginId }
  }
}

/** Move to the next batch of the current window, or on to the next window. */
function nextBatch(cursor: AuthorizeNetCursor): AuthorizeNetCursor {
  const batches = cursor.batches ?? []
  const batchIndex = cursor.batchIndex + 1
  return batchIndex < batches.length
    ? { ...cursor, phase: 'members', batchIndex, offset: 1, pageIndex: 0 }
    : {
        ...cursor,
        phase: 'headers',
        windowIndex: cursor.windowIndex + 1,
        batches: undefined,
        batchIndex: 0,
        offset: 1,
        pageIndex: 0,
      }
}

/** Translate the header, keeping a rejection rather than losing the batch. */
function headerProjection(raw: AuthorizeNetBatch, currency: string | undefined) {
  try {
    return { payout: payoutEvidence(raw, { currency }), rejectionReason: null }
  } catch (error) {
    return {
      payout: null,
      rejectionReason: error instanceof Error ? error.message : 'Invalid Authorize.net batch',
    }
  }
}

interface ProjectedMembers {
  entries: Record<string, unknown>[]
  rejections: { index: number; raw: unknown; reason: string }[]
  rawRows: unknown[]
}

/** Translate one member page; a row carrying no settled money is omitted, not rejected. */
function projectMembers(
  rows: AuthorizeNetTransactionSummary[],
  batch: AuthorizeNetBatch,
  currency: string | undefined
): ProjectedMembers {
  const entries: Record<string, unknown>[] = []
  const rejections: { index: number; raw: unknown; reason: string }[] = []
  const rawRows: unknown[] = []

  rows.forEach((raw, index) => {
    rawRows.push(raw)
    try {
      const entry = processorEvidence(raw, batch, { currency })
      if (entry === null) return
      // Recognition against the Shopify order is a later, separate join (build plan §6).
      entries.push({ ...entry, sourceReference: null })
    } catch (error) {
      rejections.push({
        index,
        raw,
        reason: error instanceof Error ? error.message : 'Invalid Authorize.net transaction',
      })
    }
  })

  return { entries, rejections, rawRows }
}

function payoutRecord(
  cursor: AuthorizeNetCursor,
  batch: AuthorizeNetBatch,
  membership: Record<string, unknown>
): ConnectorRecord {
  let id: string
  try {
    id = authorizeNetId(batch.batchId)
  } catch {
    id = `rejected:${cursor.scanId}:batch:${cursor.windowIndex}:${cursor.batchIndex}`
  }
  const projection = headerProjection(batch, cursor.currency)
  return {
    streamKey: 'payout',
    externalId: id,
    displayName: `Authorize.net batch ${id}`,
    fields: payoutSourceFields({
      externalId: id,
      sourceAccount: {
        providerKey: AUTHORIZE_NET_PROVIDER_KEY,
        externalAccountId: cursor.accountId,
        environment: cursor.environment,
      },
      acquisition: { id: `${cursor.scanId}:${id}`, startedAt: cursor.startedAt },
      payout: projection.payout === null ? null : { ...projection.payout },
      rejectionReason: projection.rejectionReason,
      raw: batch,
      membership: {
        providerReady: batch.settlementState === 'settledSuccessfully',
        ...membership,
      },
    }),
  }
}

/** Read one settlement window's batches and open the first one's membership. */
async function fetchHeaderPage(
  credentials: AuthorizeNetCredentials,
  cursor: AuthorizeNetCursor,
  windows: { first: string; last: string }[]
): Promise<ConnectorFetchResult> {
  const window = windows[cursor.windowIndex]
  if (!window) return { records: [] }

  const batches = await fetchSettledBatches({
    credentials,
    first: window.first,
    last: window.last,
    includeStatistics: true,
  })
  if (batches.length === 0) {
    return {
      records: [],
      cursor: { ...cursor, windowIndex: cursor.windowIndex + 1, batchIndex: 0 },
    }
  }
  return {
    records: [],
    cursor: { ...cursor, phase: 'members', batches, batchIndex: 0, offset: 1, pageIndex: 0 },
  }
}

/**
 * Page one batch's transactions. `offset` is 1-based, so the loop ends when
 * `offset - 1 + returned` reaches the total; nothing returned while more is claimed is
 * a provider fault, not completeness.
 */
async function fetchMemberPage(
  credentials: AuthorizeNetCredentials,
  cursor: AuthorizeNetCursor
): Promise<ConnectorFetchResult> {
  const batch = (cursor.batches ?? [])[cursor.batchIndex]
  if (!batch) throw new Error('Authorize.net membership cursor has no batch')
  const batchId = authorizeNetId(batch.batchId)

  try {
    const limit = AUTHORIZE_NET_MEMBER_PAGE_LIMIT
    const page = await fetchBatchTransactions({
      credentials,
      batchId,
      limit,
      offset: cursor.offset,
    })
    const returned = page.transactions.length
    const seen = cursor.offset - 1 + returned
    const more = returned === limit && seen < page.total
    const stalled = returned === 0 && seen < page.total

    const projected = projectMembers(page.transactions, batch, cursor.currency)
    const reason = stalled
      ? 'Authorize.net returned no transactions for a batch page that reports more'
      : projected.rejections.length
        ? 'Authorize.net batch membership contains rejected source rows'
        : more
          ? 'Authorize.net batch membership has more transaction pages'
          : null

    return {
      records: [
        payoutRecord(cursor, batch, {
          complete: !more && !reason,
          reason,
          page: {
            id: `${cursor.scanId}:${batchId}:${cursor.pageIndex}`,
            index: cursor.pageIndex,
            requestCursor: String(cursor.offset),
            nextCursor: more ? String(cursor.offset + returned) : null,
            terminal: !more,
          },
          ...projected,
        }),
      ],
      cursor:
        more && !stalled
          ? { ...cursor, offset: cursor.offset + returned, pageIndex: cursor.pageIndex + 1 }
          : nextBatch(cursor),
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error
    // Recorded as incomplete with a reason, so the batch is visible and un-postable
    // rather than absent or silently short.
    return {
      records: [
        payoutRecord(cursor, batch, {
          complete: false,
          page: null,
          entries: [],
          rejections: [],
          rawRows: [],
          reason:
            error instanceof Error
              ? error.message
              : 'Authorize.net batch membership is unavailable',
        }),
      ],
      cursor: nextBatch(cursor),
    }
  }
}

/** Fetch one bounded source page. The platform owns cursor persistence. */
export async function fetchAuthorizeNetStream(
  args: ConnectorExecuteArgs
): Promise<ConnectorFetchResult> {
  // A connector is handed its connection; `getConnection()` resolves a tool context.
  const credentials = authorizeNetCredentialsFrom(args.connection?.fields)
  const cursor = resumeCursor(args.cursor, args.streamKey)
  const windows = periodWindows(args.query)

  if (!cursor) {
    const account = await resolveAccount(credentials)
    return {
      records: [],
      cursor: {
        version: 1,
        streamKey: args.streamKey,
        scanId: crypto.randomUUID(),
        startedAt: new Date().toISOString(),
        phase: 'headers',
        accountId: account.accountId,
        environment: credentials.environment,
        currency: account.currency,
        windowIndex: 0,
        batchIndex: 0,
        offset: 1,
        pageIndex: 0,
      } satisfies AuthorizeNetCursor,
    }
  }

  if (cursor.environment !== credentials.environment) {
    throw new Error('The Authorize.net environment changed during acquisition; restart the scan')
  }

  try {
    return cursor.phase === 'headers'
      ? await fetchHeaderPage(credentials, cursor, windows)
      : await fetchMemberPage(credentials, cursor)
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Never sleep: the platform re-invokes with this same cursor after the wait.
      return {
        records: [],
        rateLimited: {
          retryAfterMs:
            error.retryAfterSeconds === undefined ? undefined : error.retryAfterSeconds * 1000,
        },
      }
    }
    throw error
  }
}

export default fetchAuthorizeNetStream
