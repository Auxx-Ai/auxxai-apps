// src/tools/batch-quickbooks-operations.tool.server.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapBill, type MappedBill } from './shared/map-bill'
import { mapCreditMemo, type MappedCreditMemo } from './shared/map-credit-memo'
import { mapInvoiceSummary, type MappedInvoiceSummary } from './shared/map-invoice'
import { mapJournalEntry, type MappedJournalEntry } from './shared/map-journal-entry'
import { mapRefundReceipt, type MappedRefundReceipt } from './shared/map-refund-receipt'
import { mapSalesReceipt, type MappedSalesReceipt } from './shared/map-sales-receipt'
import { NATIVE_CREATES, type NativeCreateObject } from './shared/native-creates'
import { quoteQqlString, quoteQqlStringBackslash } from './shared/qql-builder'

/** Intuit's cap on BatchItemRequest entries per call. */
export const BATCH_MAX_ITEMS = 30
/** Intuit caps a batch call's `requestid` at 36 characters, not the usual 50. */
const BATCH_REQUEST_ID_MAX_LENGTH = 36
/** With a `requestid`, Intuit allows at most 10 characters per `bId`. */
const BATCH_BID_MAX_LENGTH_WITH_REQUEST_ID = 10
/** The single find tools' default `limit`, kept per docNumber so a query answer matches theirs. */
const FIND_LIMIT = 20
const MAX_DOC_NUMBERS_PER_QUERY = 30

/** The find_quickbooks_<object> answer each query object maps to, keyed like NATIVE_CREATES. */
const NATIVE_FINDS = {
  invoice: {
    entity: 'Invoice',
    listField: 'invoices',
    map: mapInvoiceSummary,
    quote: quoteQqlString,
  },
  sales_receipt: {
    entity: 'SalesReceipt',
    listField: 'salesReceipts',
    map: mapSalesReceipt,
    quote: quoteQqlString,
  },
  credit_memo: {
    entity: 'CreditMemo',
    listField: 'creditMemos',
    map: mapCreditMemo,
    quote: quoteQqlString,
  },
  refund_receipt: {
    entity: 'RefundReceipt',
    listField: 'refundReceipts',
    map: mapRefundReceipt,
    quote: quoteQqlString,
  },
  bill: { entity: 'Bill', listField: 'bills', map: mapBill, quote: quoteQqlString },
  journal: {
    entity: 'JournalEntry',
    listField: 'journalEntries',
    map: mapJournalEntry,
    quote: quoteQqlStringBackslash,
  },
} as const

export type BatchCreateObject = NativeCreateObject
/** Payment and Deposit carry no DocNumber in QuickBooks, so they cannot be queried by one. */
export type BatchQueryObject = keyof typeof NATIVE_FINDS

type CreateInputOf<K extends BatchCreateObject> = Omit<
  Parameters<(typeof NATIVE_CREATES)[K]['buildBody']>[0],
  'requestId'
>
type CreateAnswerOf<K extends BatchCreateObject> = ReturnType<
  (typeof NATIVE_CREATES)[K]['mapAnswer']
>

export type BatchCreateItem = {
  [K in BatchCreateObject]: { bId: string; operation: 'create'; object: K; input: CreateInputOf<K> }
}[BatchCreateObject]

export interface BatchQueryItem {
  bId: string
  operation: 'query'
  object: BatchQueryObject
  docNumbers: string[]
}

export type BatchItem = BatchCreateItem | BatchQueryItem

export interface BatchQuickbooksOperationsInput {
  /** Call-level idempotency key, max 36 chars; Intuit dedupes each item on (requestId, bId). */
  requestId?: string
  items: BatchItem[]
}

/** Intuit's per-item `Fault.type` plus its first `Fault.Error[]` entry. */
export interface BatchItemFault {
  type: string | null
  code: string | null
  message: string | null
  detail: string | null
  element: string | null
}

/** A failed item: `code` is the SDK error code the single tool would have thrown with. */
export interface BatchItemError {
  code: string
  message: string
  /** Null when the item failed validation here and never reached QuickBooks. */
  fault: BatchItemFault | null
}

/** One find_quickbooks_<object> answer, e.g. `{ invoices: [...] }`. */
export type BatchFindAnswer =
  | { invoices: MappedInvoiceSummary[] }
  | { salesReceipts: MappedSalesReceipt[] }
  | { creditMemos: MappedCreditMemo[] }
  | { refundReceipts: MappedRefundReceipt[] }
  | { bills: MappedBill[] }
  | { journalEntries: MappedJournalEntry[] }

export type BatchItemResult =
  | {
      bId: string
      operation: 'create'
      object: BatchCreateObject
      ok: true
      result: CreateAnswerOf<BatchCreateObject>
    }
  | {
      bId: string
      operation: 'query'
      object: BatchQueryObject
      ok: true
      /** Keyed by each requested docNumber, exactly as sent. */
      result: Record<string, BatchFindAnswer>
    }
  | {
      bId: string
      operation: 'create' | 'query'
      object: BatchCreateObject | BatchQueryObject
      ok: false
      error: BatchItemError
    }

export interface BatchQuickbooksOperationsOutput {
  /** One entry per requested item, in request order. */
  items: BatchItemResult[]
}

/** Maps Intuit's fault type to the code the single tool's HTTP status would have produced. */
const FAULT_TYPE_CODE: Record<string, string> = {
  ValidationFault: 'INVALID_INPUT',
  SystemFault: 'UPSTREAM_ERROR',
  AuthenticationFault: 'CONNECTION_EXPIRED',
  AuthorizationFault: 'INSUFFICIENT_PERMISSIONS',
}

function isCreateObject(object: unknown): object is BatchCreateObject {
  return typeof object === 'string' && Object.prototype.hasOwnProperty.call(NATIVE_CREATES, object)
}

function isQueryObject(object: unknown): object is BatchQueryObject {
  return typeof object === 'string' && Object.prototype.hasOwnProperty.call(NATIVE_FINDS, object)
}

/** Structural problems refuse the whole call; content problems fail only their item. */
function validateCall(input: BatchQuickbooksOperationsInput): void {
  const items = input?.items
  if (!Array.isArray(items) || items.length === 0) {
    throw new InvalidInputError('items must contain at least one operation.')
  }
  if (items.length > BATCH_MAX_ITEMS) {
    throw new InvalidInputError(
      `QuickBooks takes at most ${BATCH_MAX_ITEMS} operations per batch, got ${items.length}.`
    )
  }
  if (input.requestId != null && input.requestId.length > BATCH_REQUEST_ID_MAX_LENGTH) {
    throw new InvalidInputError(
      `requestId must be at most ${BATCH_REQUEST_ID_MAX_LENGTH} characters for a batch, got ${input.requestId.length}.`
    )
  }

  const seen = new Set<string>()
  items.forEach((item, i) => {
    const where = `items[${i}]`
    if (typeof item?.bId !== 'string' || item.bId.trim() === '') {
      throw new InvalidInputError(`${where}.bId is required.`)
    }
    if (seen.has(item.bId)) throw new InvalidInputError(`${where}.bId "${item.bId}" is repeated.`)
    seen.add(item.bId)
    if (input.requestId && item.bId.length > BATCH_BID_MAX_LENGTH_WITH_REQUEST_ID) {
      throw new InvalidInputError(
        `${where}.bId must be at most ${BATCH_BID_MAX_LENGTH_WITH_REQUEST_ID} characters when requestId is set.`
      )
    }
    if (item.operation === 'create') {
      if (!isCreateObject(item.object)) {
        throw new InvalidInputError(`${where}: cannot create a "${String(item.object)}".`)
      }
      if (!item.input || typeof item.input !== 'object') {
        throw new InvalidInputError(`${where}.input is required.`)
      }
      if ('requestId' in item.input) {
        throw new InvalidInputError(
          `${where}.input.requestId is not honoured inside a batch; pass requestId once, at the top level.`
        )
      }
    } else if (item.operation === 'query') {
      if (!isQueryObject(item.object)) {
        throw new InvalidInputError(`${where}: cannot query a "${String(item.object)}".`)
      }
    } else {
      throw new InvalidInputError(`${where}.operation must be "create" or "query".`)
    }
  })
}

function buildQuery(item: BatchQueryItem): string {
  const docNumbers = item.docNumbers
  if (!Array.isArray(docNumbers) || docNumbers.length === 0) {
    throw new InvalidInputError('docNumbers must contain at least one document number.')
  }
  if (docNumbers.length > MAX_DOC_NUMBERS_PER_QUERY) {
    throw new InvalidInputError(
      `docNumbers takes at most ${MAX_DOC_NUMBERS_PER_QUERY} document numbers, got ${docNumbers.length}.`
    )
  }
  if (docNumbers.some((d) => typeof d !== 'string' || d === '')) {
    throw new InvalidInputError('docNumbers must be non-empty strings.')
  }
  const find = NATIVE_FINDS[item.object]
  const list = [...new Set(docNumbers)].map((d) => find.quote(d)).join(', ')
  return `SELECT * FROM ${find.entity} WHERE DocNumber IN (${list}) MAXRESULTS 1000`
}

/** Throws InvalidInputError, exactly where the matching single tool would before its HTTP call. */
function toBatchItemRequest(item: BatchItem): Record<string, unknown> {
  if (item.operation === 'query') return { bId: item.bId, Query: buildQuery(item) }
  const create = NATIVE_CREATES[item.object]
  const buildBody = create.buildBody as (input: unknown) => Record<string, unknown>
  return { bId: item.bId, operation: 'create', [create.entity]: buildBody(item.input) }
}

function localError(error: unknown): BatchItemError {
  const code = (error as { code?: unknown })?.code
  return {
    code: typeof code === 'string' ? code : 'INVALID_INPUT',
    message: error instanceof Error ? error.message : String(error),
    fault: null,
  }
}

function faultError(fault: any): BatchItemError {
  const first = fault?.Error?.[0]
  const type = typeof fault?.type === 'string' ? fault.type : null
  return {
    code: (type && FAULT_TYPE_CODE[type]) ?? 'EXECUTION_ERROR',
    message: first?.Detail || first?.Message || `QuickBooks refused the item (${type ?? 'fault'}).`,
    fault: {
      type,
      code: first?.code != null ? String(first.code) : null,
      message: first?.Message ?? null,
      detail: first?.Detail ?? null,
      element: first?.element ?? null,
    },
  }
}

function missingAnswer(item: BatchItem, what: string): BatchItemError {
  return {
    code: 'UPSTREAM_ERROR',
    message: `QuickBooks returned no ${what} for batch item "${item.bId}".`,
    fault: null,
  }
}

/** Group a query's rows back per requested docNumber, case-insensitively as Intuit matches them. */
function mapQueryAnswer(item: BatchQueryItem, rows: any[]): Record<string, BatchFindAnswer> {
  const find = NATIVE_FINDS[item.object]
  const byDoc = new Map<string, any[]>()
  for (const row of rows) {
    const key = String(row?.DocNumber ?? '').toLowerCase()
    byDoc.set(key, [...(byDoc.get(key) ?? []), row])
  }
  const result: Record<string, BatchFindAnswer> = {}
  for (const docNumber of item.docNumbers) {
    const hits = (byDoc.get(docNumber.toLowerCase()) ?? []).slice(0, FIND_LIMIT)
    result[docNumber] = { [find.listField]: hits.map(find.map as (raw: any) => unknown) } as any
  }
  return result
}

function settle(item: BatchItem, response: any): BatchItemResult {
  const failed = (error: BatchItemError): BatchItemResult => ({
    bId: item.bId,
    operation: item.operation,
    object: item.object,
    ok: false,
    error,
  })
  if (!response) return failed(missingAnswer(item, 'answer'))
  if (response.Fault) return failed(faultError(response.Fault))

  if (item.operation === 'query') {
    const queryResponse = response.QueryResponse
    if (!queryResponse) return failed(missingAnswer(item, 'QueryResponse'))
    const rows = queryResponse[NATIVE_FINDS[item.object].entity] ?? []
    return {
      bId: item.bId,
      operation: 'query',
      object: item.object,
      ok: true,
      result: mapQueryAnswer(item, rows),
    }
  }

  const create = NATIVE_CREATES[item.object]
  const raw = response[create.entity]
  if (!raw) return failed(missingAnswer(item, create.entity))
  return {
    bId: item.bId,
    operation: 'create',
    object: item.object,
    ok: true,
    result: (create.mapAnswer as (raw: any) => CreateAnswerOf<BatchCreateObject>)(raw),
  }
}

export default async function batchQuickbooksOperations(
  input: BatchQuickbooksOperationsInput
): Promise<BatchQuickbooksOperationsOutput> {
  validateCall(input)

  const prepared = input.items.map((item) => {
    try {
      return { item, request: toBatchItemRequest(item) }
    } catch (error) {
      return { item, error: localError(error) }
    }
  })
  const requests = prepared.flatMap((p) => (p.request ? [p.request] : []))

  const responses = new Map<string, any>()
  if (requests.length > 0) {
    const { credential, realmId, sandbox } = await getQuickbooksConnection()
    // A whole-call failure (auth, throttle, 5xx, transport) throws here, as the single tools do.
    const result = await quickbooksApi<any>(realmId, '/batch', credential, {
      method: 'POST',
      sandbox,
      requestId: input.requestId,
      body: { BatchItemRequest: requests },
    })
    for (const response of result?.BatchItemResponse ?? []) {
      responses.set(String(response?.bId), response)
    }
  }

  return {
    items: prepared.map((p) =>
      p.error
        ? {
            bId: p.item.bId,
            operation: p.item.operation,
            object: p.item.object,
            ok: false as const,
            error: p.error,
          }
        : settle(p.item, responses.get(p.item.bId))
    ),
  }
}
