// apps/shopify/tests/payments-streams.test.ts

import type { ConnectorExecuteArgs, ConnectorRecord } from '@auxx/sdk/data-connectors'
import { InsufficientPermissionsError } from '@auxx/sdk/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  balanceEvidence,
  evidenceCurrencyExponent,
  exactEvidenceAmount,
} from '../src/blocks/shopify/shared/payments-evidence'
import type { GqlBalanceTransaction, GqlPayout } from '../src/graphql/payments'
import { fetchPaymentsStream } from '../src/payments.connector.server'
import { shopifyConnector } from '../src/shopify.connector'

const payoutNode: GqlPayout = {
  legacyResourceId: '10',
  status: 'PAID',
  issuedAt: '2026-09-12T08:00:00Z',
  net: { amount: '97.00', currencyCode: 'USD' },
  summary: {},
}
const transaction = {
  id: 21,
  type: 'charge',
  test: false,
  payout_id: 10,
  payout_status: 'paid',
  currency: 'USD',
  amount: '100.00',
  fee: '3.00',
  net: '97.00',
  source_id: 31,
  source_type: 'charge',
  source_order_id: 41,
  source_order_transaction_id: 51,
  processed_at: '2026-09-11T10:00:00Z',
}
/** The GraphQL node `toRawBalanceTransaction` turns into `transaction` above. */
const transactionNode: GqlBalanceTransaction = {
  id: 'gid://shopify/ShopifyPaymentsBalanceTransaction/21',
  type: 'CHARGE',
  test: false,
  associatedPayout: { id: 'gid://shopify/ShopifyPaymentsPayout/10', status: 'PAID' },
  amount: { amount: '100.00', currencyCode: 'USD' },
  fee: { amount: '3.00' },
  net: { amount: '97.00' },
  sourceId: '31',
  sourceType: 'CHARGE',
  associatedOrder: { id: 'gid://shopify/Order/41' },
  sourceOrderTransactionId: '51',
  transactionDate: '2026-09-11T10:00:00Z',
}
const txId = (id: number | string | null) =>
  id === null ? null : `gid://shopify/ShopifyPaymentsBalanceTransaction/${id}`
const ACCOUNT = 'gid://shopify/ShopifyPaymentsAccount/777'
type Kind = 'payouts' | 'balanceTransactions'
type Page = { nodes: unknown[]; next?: string } | Response
function response(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}
function accountResponse(kind: Kind, nodes: unknown[], next?: string, id = ACCOUNT) {
  const pageInfo = { hasNextPage: next !== undefined, endCursor: next ?? null }
  return response({ data: { shopifyPaymentsAccount: { id, [kind]: { nodes, pageInfo } } } })
}
/** Routes each Admin GraphQL call by the connection it asks for. */
function setup(handler: (kind: Kind, variables: Record<string, unknown>) => Page) {
  const fetch = vi.fn(async (_url: string, init: RequestInit) => {
    const { query, variables } = JSON.parse(String(init.body))
    const kind: Kind = query.includes('payouts(') ? 'payouts' : 'balanceTransactions'
    const page = handler(kind, variables)
    return page instanceof Response ? page : accountResponse(kind, page.nodes, page.next)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
function request(fetch: ReturnType<typeof setup>, index: number) {
  const [url, init] = fetch.mock.calls.at(index)!
  const body = JSON.parse(String(init.body))
  return { url, query: body.query as string, variables: body.variables }
}
function sync(streamKey = 'payout', overrides: Partial<ConnectorExecuteArgs> = {}) {
  return fetchPaymentsStream({
    streamKey,
    query: {},
    config: {},
    connection: { value: 'test-token', metadata: { connectionVariables: { shop: 'test-shop' } } },
    ...overrides,
  })
}
function evidence(result: Awaited<ReturnType<typeof sync>>) {
  const fields = (result.records as ConnectorRecord[])[0]!.fields
  return {
    ...fields,
    acquisition: { id: fields.acquisitionId, startedAt: fields.acquiredAt },
    sourceAccount: { externalAccountId: fields.externalAccountId, providerKey: fields.providerKey },
    payout: fields.rejectionReason ? null : fields,
  } as unknown as {
    acquisition: { id: string; startedAt: string }
    sourceAccount: { externalAccountId: string; providerKey: string }
    payout: { amount: string; currencyExponent: number; issuedOn: string; issuedAt: null } | null
    raw: unknown
    rejectionReason: string | null
    membership: {
      complete: boolean
      providerReady: boolean
      reason: string | null
      page: { id: string; index: number; requestCursor: string | null; terminal: boolean } | null
      entries: ReturnType<typeof balanceEvidence>[]
      rawRows: unknown[]
      rejections: { raw: unknown; reason: string; index: number }[]
    }
  }
}
async function seeded(streamKey = 'payout', overrides: Partial<ConnectorExecuteArgs> = {}) {
  const seed = await sync(streamKey, overrides)
  return sync(streamKey, { ...overrides, cursor: seed.cursor })
}
async function memberPage() {
  const header = await seeded()
  return sync('payout', { cursor: header.cursor })
}
afterEach(() => vi.unstubAllGlobals())

describe('bounded Shopify Payments source acquisition', () => {
  it('maps financial values separately and creates children through the standard mapper', () => {
    const payout = shopifyConnector.streams.find((stream) => stream.key === 'payout')!
    expect(payout.mappings[0]!.fields).toEqual(
      expect.arrayContaining([
        { sourcePath: 'amount', target: 'payout_source_amount' },
        { sourcePath: 'currency', target: 'payout_source_currency' },
        { sourcePath: 'status', target: 'payout_source_status' },
      ])
    )
    expect(payout.mappings[1]).toMatchObject({
      rootPath: 'processorTransactions[]',
      target: { entityKind: 'processor_balance_entry' },
      relationshipFieldKey: 'system:payout_processor_entries',
    })
    const balance = shopifyConnector.streams.find((stream) => stream.key === 'balance_transaction')!
    expect(balance.mappings[0]!.fields).toEqual(
      expect.arrayContaining([
        { sourcePath: 'gross', target: 'processor_balance_gross' },
        { sourcePath: 'fee', target: 'processor_balance_fee' },
        { sourcePath: 'net', target: 'processor_balance_net' },
      ])
    )
    expect(JSON.stringify([payout.mappings, balance.mappings])).not.toContain('_evidence')
  })

  it('checkpoints stable acquisition identity before fetching source data', async () => {
    const fetch = setup(() => ({ nodes: [] }))
    const first = await sync()
    expect(first.records).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
    expect(first.cursor).toMatchObject({ version: 3, phase: 'headers', pageIndex: 0 })
  })

  it('returns separate header and one member page per call with stable retry identity', async () => {
    const fetch = setup((kind, variables) => {
      if (kind === 'payouts')
        return { nodes: [{ ...payoutNode, net: { amount: '96.00', currencyCode: 'USD' } }] }
      if (variables.after === 'second')
        return {
          nodes: [
            {
              ...transactionNode,
              id: txId(22),
              type: 'TRANSFER',
              amount: { amount: '-97.00', currencyCode: 'USD' },
              fee: { amount: '0.00' },
              net: { amount: '-97.00' },
            },
          ],
        }
      return { nodes: [transactionNode], next: 'second' }
    })
    const header = await seeded()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(evidence(header)).toMatchObject({
      payout: { amount: '96.00', issuedAt: null, issuedOn: '2026-09-12', currencyExponent: 2 },
      membership: { page: null, complete: false },
    })
    const first = await sync('payout', { cursor: header.cursor })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(request(fetch, -1).variables).toEqual({ after: null, query: 'payments_transfer_id:10' })
    expect(evidence(first).membership).toMatchObject({
      complete: false,
      page: { index: 0, terminal: false },
    })
    expect(evidence(first).membership.entries).toHaveLength(1)
    expect(JSON.stringify(first.cursor)).not.toContain('100.00')
    const retry = await sync('payout', { cursor: header.cursor })
    expect(evidence(retry)).toEqual(evidence(first))
    const final = await sync('payout', { cursor: first.cursor })
    expect(evidence(final).acquisition).toEqual(evidence(first).acquisition)
    expect(evidence(final).membership).toMatchObject({
      complete: true,
      page: { index: 1, terminal: true },
      entries: [{ type: 'outgoing_transfer', providerType: 'payout', net: '-97.00' }],
    })
    expect(request(fetch, -1).variables).toEqual({
      after: 'second',
      query: 'payments_transfer_id:10',
    })
    expect(final.cursor).toBeUndefined()
  })

  it('retains malformed raw rows and exact successful rows on the same page', async () => {
    const malformed = { ...transaction, id: 22, amount: 100 }
    setup((kind) =>
      kind === 'payouts'
        ? { nodes: [payoutNode] }
        : {
            nodes: [
              transactionNode,
              { ...transactionNode, id: txId(22), amount: { amount: 100, currencyCode: 'USD' } },
              null,
              {
                ...transactionNode,
                id: txId(23),
                associatedPayout: { id: 'gid://shopify/ShopifyPaymentsPayout/99', status: 'PAID' },
              },
            ],
          }
    )
    const result = evidence(await memberPage())
    expect(result.membership).toMatchObject({ complete: false, page: { terminal: true } })
    expect(result.membership.rawRows).toHaveLength(4)
    expect(result.membership.entries).toHaveLength(1)
    expect(result.membership.rejections).toHaveLength(3)
    expect(result.membership.rejections[0]!.raw).toEqual(malformed)
  })

  it('retains invalid independent payout amount without inventing a replacement', async () => {
    setup((kind) =>
      kind === 'payouts'
        ? { nodes: [{ ...payoutNode, net: { amount: 97, currencyCode: 'USD' } }] }
        : { nodes: [] }
    )
    expect(evidence(await seeded())).toMatchObject({
      payout: null,
      raw: { amount: 97 },
      rejectionReason: expect.stringContaining('invalid decimal'),
    })
  })

  it('retains a malformed payout source identity as a diagnostic record', async () => {
    setup(() => ({ nodes: [{ ...payoutNode, legacyResourceId: Number.MAX_SAFE_INTEGER + 1 }] }))
    const result = await seeded()
    expect(evidence(result)).toMatchObject({
      payout: null,
      raw: { id: Number.MAX_SAFE_INTEGER + 1 },
      rejectionReason: expect.stringContaining('unsafe'),
    })
    expect((result.records as ConnectorRecord[])[0]!.externalId).toMatch(/^rejected:/)
    expect(result.cursor).toBeUndefined()
  })

  it('never seals a failed or expired membership request as complete', async () => {
    setup((kind) => (kind === 'payouts' ? { nodes: [payoutNode] } : response({}, 400)))
    const result = await memberPage()
    expect(evidence(result).membership).toMatchObject({
      complete: false,
      page: null,
      reason: expect.stringContaining('400'),
    })
    expect(result.cursor).toBeUndefined()
  })

  it('retries a throttled page using the already checkpointed cursor', async () => {
    setup((kind) =>
      kind === 'payouts' ? { nodes: [payoutNode] } : response({}, 429, { 'Retry-After': '4' })
    )
    const header = await seeded()
    const result = await sync('payout', { cursor: header.cursor })
    expect(result).toEqual({
      records: [],
      rateLimited: { retryAfterMs: 4000 },
    })
  })

  it('detects an immediately repeated cursor without draining a loop', async () => {
    setup((kind) =>
      kind === 'payouts' ? { nodes: [payoutNode] } : { nodes: [transactionNode], next: 'same' }
    )
    const first = await memberPage()
    const next = await sync('payout', { cursor: first.cursor })
    expect(evidence(next).membership).toMatchObject({
      complete: false,
      reason: expect.stringContaining('repeated'),
    })
    expect(next.cursor).toBeUndefined()
  })

  it('retains duplicate conflicts for shared coverage assessment', async () => {
    setup((kind) =>
      kind === 'payouts'
        ? { nodes: [payoutNode] }
        : { nodes: [transactionNode, { ...transactionNode, net: { amount: '96.00' } }] }
    )
    expect(evidence(await memberPage()).membership).toMatchObject({
      complete: false,
      rejections: [{ index: 1, reason: expect.stringContaining('changed') }],
    })
  })

  it.each(['scheduled', 'in_transit', 'failed', 'canceled'])(
    'keeps %s header lifecycle separate from terminal traversal',
    async (status) => {
      setup((kind) =>
        kind === 'payouts'
          ? { nodes: [{ ...payoutNode, status: status.toUpperCase() }] }
          : { nodes: [] }
      )
      expect(evidence(await memberPage()).membership).toMatchObject({
        complete: true,
        providerReady: false,
      })
    }
  )

  it('normalizes outgoing and returned movements without assuming unknown semantics', () => {
    for (const [providerType, type] of [
      ['payout', 'outgoing_transfer'],
      ['payout_failure', 'returned_transfer'],
      ['payout_cancellation', 'returned_transfer'],
      ['payout_cancel', 'unknown'],
      ['dispute', 'unknown'],
    ]) {
      expect(balanceEvidence({ ...transaction, type: providerType! })).toMatchObject({
        providerType,
        type,
      })
    }
  })

  it('keeps unassigned activity, exact transaction references, test mode and invalid raw data', async () => {
    setup(() => ({
      nodes: [
        { ...transactionNode, id: txId('9007199254740993'), associatedPayout: null, test: true },
        { ...transactionNode, id: null },
      ],
    }))
    const result = await seeded('balance_transaction')
    expect((result.records as ConnectorRecord[])[0]).toMatchObject({
      externalId: '9007199254740993',
      fields: {
        environment: 'test',
        providerKey: 'shopify_payments',
        payoutId: null,
        sourceTransactionId: '51',
        sourceReference: {
          sourceAccount: {
            providerKey: 'shopify',
            externalAccountId: 'test-shop.myshopify.com',
            environment: 'test',
          },
          objectType: 'order_transaction',
          externalId: '51',
          componentKey: '',
        },
      },
    })
    expect((result.records as ConnectorRecord[])[1]!.fields).toMatchObject({
      raw: { id: null },
      rejectionReason: expect.stringContaining('source ID'),
    })
    expect((result.records as ConnectorRecord[])[0]!.fields).not.toHaveProperty(
      'processorBalanceEvidence'
    )
  })

  it('refuses a merchant change during membership acquisition', async () => {
    setup((kind) => (kind === 'payouts' ? { nodes: [payoutNode] } : { nodes: [] }))
    const header = await seeded()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        accountResponse(
          'balanceTransactions',
          [],
          undefined,
          'gid://shopify/ShopifyPaymentsAccount/888'
        )
      )
    )
    await expect(sync('payout', { cursor: header.cursor })).rejects.toThrow('merchant changed')
  })

  it('sends the period floor on every header page, since GraphQL cursors do not carry it', async () => {
    const fetch = setup((_kind, variables) => ({
      nodes: [],
      next: variables.after ? undefined : 'next',
    }))
    const query = { period: { from: '2026-01-01T00:00:00.000Z' } }
    const first = await seeded('payout', { query })
    expect(request(fetch, 0).variables).toEqual({ after: null, query: 'issued_at:>=2026-01-01' })
    await sync('payout', { query, cursor: first.cursor })
    expect(request(fetch, 1).variables).toEqual({ after: 'next', query: 'issued_at:>=2026-01-01' })
  })

  it('requires actual processor identity and explicit account permission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ data: { shopifyPaymentsAccount: null } }))
    )
    await expect(seeded()).rejects.toThrow('account identity is unavailable')
    await expect(
      sync('payout', {
        connection: {
          value: 'token',
          metadata: {
            connectionVariables: { shop: 'test-shop' },
            scope: 'read_shopify_payments_payouts',
          },
        },
      })
    ).rejects.toBeInstanceOf(InsufficientPermissionsError)
  })

  it('preserves exact decimal strings and actual currency precision', () => {
    expect(exactEvidenceAmount('-9007199254740993.01')).toBe('-9007199254740993.01')
    expect(evidenceCurrencyExponent('JPY')).toBe(0)
    expect(evidenceCurrencyExponent('KWD')).toBe(3)
    expect(() => exactEvidenceAmount(97)).toThrow()
    expect(() => exactEvidenceAmount('1.2oops')).toThrow()
    expect(() => balanceEvidence({ ...transaction, id: Number.MAX_SAFE_INTEGER + 1 })).toThrow(
      'unsafe'
    )
  })
})
