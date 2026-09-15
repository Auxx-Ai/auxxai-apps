// apps/shopify/tests/payments-streams.test.ts

import type { ConnectorExecuteArgs, ConnectorRecord } from '@auxx/sdk/data-connectors'
import { InsufficientPermissionsError } from '@auxx/sdk/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  balanceEvidence,
  evidenceCurrencyExponent,
  exactEvidenceAmount,
} from '../src/blocks/shopify/shared/payments-evidence'
import { fetchPaymentsStream } from '../src/payments.connector.server'
import { shopifyConnector } from '../src/shopify.connector'

const payout = {
  id: 10,
  status: 'paid',
  amount: '97.00',
  currency: 'USD',
  date: '2026-09-12',
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
function response(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}
function setup(handler: (url: URL) => Response) {
  const fetch = vi.fn(async (url: string) =>
    url.endsWith('/graphql.json')
      ? response({
          data: { shopifyPaymentsAccount: { id: 'gid://shopify/ShopifyPaymentsAccount/777' } },
        })
      : handler(new URL(url)),
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}
function sync(streamKey = 'payout', overrides: Partial<ConnectorExecuteArgs> = {}) {
  return fetchPaymentsStream({
    streamKey,
    mode: 'incremental',
    state: {},
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
  return sync(streamKey, { ...overrides, state: seed.nextState })
}
async function memberPage() {
  const header = await seeded()
  return sync('payout', { state: header.nextState })
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
      ]),
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
      ]),
    )
    expect(JSON.stringify([payout.mappings, balance.mappings])).not.toContain('_evidence')
  })

  it('checkpoints stable acquisition identity before fetching source data', async () => {
    const fetch = setup(() => response({ payouts: [] }))
    const first = await sync()
    expect(first.records).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
    expect(first.nextState.cursor).toMatchObject({ version: 2, phase: 'headers', pageIndex: 0 })
  })

  it('returns separate header and one member page per call with stable retry identity', async () => {
    const fetch = setup((url) => {
      if (url.pathname.endsWith('/payouts.json'))
        return response({ payouts: [{ ...payout, amount: '96.00' }] })
      if (url.searchParams.has('page_info'))
        return response({
          transactions: [
            {
              ...transaction,
              id: 22,
              type: 'payout',
              amount: '-97.00',
              fee: '0.00',
              net: '-97.00',
            },
          ],
        })
      return response({ transactions: [transaction] }, 200, {
        Link: '<https://test-shop.myshopify.com/x?page_info=second>; rel="next"',
      })
    })
    const header = await seeded()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(evidence(header)).toMatchObject({
      payout: { amount: '96.00', issuedAt: null, issuedOn: '2026-09-12', currencyExponent: 2 },
      membership: { page: null, complete: false },
    })
    const first = await sync('payout', { state: header.nextState })
    expect(fetch).toHaveBeenCalledTimes(4)
    expect(evidence(first).membership).toMatchObject({
      complete: false,
      page: { index: 0, terminal: false },
    })
    expect(evidence(first).membership.entries).toHaveLength(1)
    expect(JSON.stringify(first.nextState)).not.toContain('100.00')
    const retry = await sync('payout', { state: header.nextState })
    expect(evidence(retry)).toEqual(evidence(first))
    const final = await sync('payout', { state: first.nextState })
    expect(evidence(final).acquisition).toEqual(evidence(first).acquisition)
    expect(evidence(final).membership).toMatchObject({
      complete: true,
      page: { index: 1, terminal: true },
      entries: [{ type: 'outgoing_transfer', providerType: 'payout', net: '-97.00' }],
    })
    expect(fetch.mock.calls.at(-1)![0]).not.toContain('payout_id=')
    expect(final.nextState.backfillComplete).toBe(true)
  })

  it('retains malformed raw rows and exact successful rows on the same page', async () => {
    const malformed = { ...transaction, id: 22, amount: 100 }
    setup((url) =>
      response(
        url.pathname.endsWith('/payouts.json')
          ? { payouts: [payout] }
          : {
              transactions: [
                transaction,
                malformed,
                null,
                { ...transaction, id: 23, payout_id: 99 },
              ],
            },
      ),
    )
    const result = evidence(await memberPage())
    expect(result.membership).toMatchObject({ complete: false, page: { terminal: true } })
    expect(result.membership.rawRows).toHaveLength(4)
    expect(result.membership.entries).toHaveLength(1)
    expect(result.membership.rejections).toHaveLength(3)
    expect(result.membership.rejections[0]!.raw).toEqual(malformed)
  })

  it('retains invalid independent payout amount without inventing a replacement', async () => {
    setup((url) =>
      response(
        url.pathname.endsWith('/payouts.json')
          ? { payouts: [{ ...payout, amount: 97 }] }
          : { transactions: [] },
      ),
    )
    expect(evidence(await seeded())).toMatchObject({
      payout: null,
      raw: { amount: 97 },
      rejectionReason: expect.stringContaining('invalid decimal'),
    })
  })

  it('retains a malformed payout source identity as a diagnostic record', async () => {
    setup(() => response({ payouts: [{ ...payout, id: Number.MAX_SAFE_INTEGER + 1 }] }))
    const result = await seeded()
    expect(evidence(result)).toMatchObject({
      payout: null,
      raw: { id: Number.MAX_SAFE_INTEGER + 1 },
      rejectionReason: expect.stringContaining('unsafe'),
    })
    expect((result.records as ConnectorRecord[])[0]!.externalId).toMatch(/^rejected:/)
    expect(result.nextState.backfillComplete).toBe(true)
  })

  it('never seals a failed or expired membership request as complete', async () => {
    setup((url) =>
      url.pathname.endsWith('/payouts.json') ? response({ payouts: [payout] }) : response({}, 400),
    )
    const result = await memberPage()
    expect(evidence(result).membership).toMatchObject({
      complete: false,
      page: null,
      reason: expect.stringContaining('400'),
    })
    expect(result.nextState.backfillComplete).toBe(true)
  })

  it('retries a throttled page using the already checkpointed cursor', async () => {
    setup((url) =>
      url.pathname.endsWith('/payouts.json')
        ? response({ payouts: [payout] })
        : response({}, 429, { 'Retry-After': '4' }),
    )
    const header = await seeded()
    const result = await sync('payout', { state: header.nextState })
    expect(result).toEqual({
      records: [],
      nextState: { cursor: header.nextState.cursor },
      rateLimited: { retryAfterMs: 4000 },
    })
  })

  it('detects an immediately repeated cursor without draining a loop', async () => {
    setup((url) =>
      url.pathname.endsWith('/payouts.json')
        ? response({ payouts: [payout] })
        : response({ transactions: [transaction] }, 200, {
            Link: '<https://test-shop.myshopify.com/x?page_info=same>; rel="next"',
          }),
    )
    const first = await memberPage()
    const next = await sync('payout', { state: first.nextState })
    expect(evidence(next).membership).toMatchObject({
      complete: false,
      reason: expect.stringContaining('repeated'),
    })
    expect(next.nextState.backfillComplete).toBe(true)
  })

  it('retains duplicate conflicts for shared coverage assessment', async () => {
    setup((url) =>
      response(
        url.pathname.endsWith('/payouts.json')
          ? { payouts: [payout] }
          : { transactions: [transaction, { ...transaction, net: '96.00' }] },
      ),
    )
    expect(evidence(await memberPage()).membership).toMatchObject({
      complete: false,
      rejections: [{ index: 1, reason: expect.stringContaining('changed') }],
    })
  })

  it.each([
    'scheduled',
    'in_transit',
    'failed',
    'canceled',
  ])('keeps %s header lifecycle separate from terminal traversal', async (status) => {
    setup((url) =>
      response(
        url.pathname.endsWith('/payouts.json')
          ? { payouts: [{ ...payout, status }] }
          : { transactions: [] },
      ),
    )
    expect(evidence(await memberPage()).membership).toMatchObject({
      complete: true,
      providerReady: false,
    })
  })

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
    setup(() =>
      response({
        transactions: [
          { ...transaction, id: '9007199254740993', payout_id: null, test: true },
          { ...transaction, id: null },
        ],
      }),
    )
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
      'processorBalanceEvidence',
    )
  })

  it('refuses a merchant change during membership acquisition', async () => {
    setup((url) =>
      response(
        url.pathname.endsWith('/payouts.json') ? { payouts: [payout] } : { transactions: [] },
      ),
    )
    const header = await seeded()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        response({
          data: { shopifyPaymentsAccount: { id: 'gid://shopify/ShopifyPaymentsAccount/888' } },
        }),
      ),
    )
    await expect(sync('payout', { state: header.nextState })).rejects.toThrow('merchant changed')
  })

  it('uses history floor only on initial header page and ignores processing-date watermarks', async () => {
    const fetch = setup((url) =>
      response(
        { payouts: [] },
        200,
        url.searchParams.has('page_info')
          ? {}
          : {
              Link: '<https://test-shop.myshopify.com/x?page_info=next>; rel="next"',
            },
      ),
    )
    const first = await seeded('payout', {
      config: { payoutHistoryStartDate: '2026-01-01' },
      state: { updatedSince: '2026-09-15' },
    })
    expect(fetch.mock.calls[1]![0]).toContain('date_min=2026-01-01')
    await sync('payout', {
      config: { payoutHistoryStartDate: '2026-01-01' },
      state: first.nextState,
    })
    expect(fetch.mock.calls[3]![0]).not.toContain('date_min')
  })

  it('requires actual processor identity and explicit account permission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ data: { shopifyPaymentsAccount: null } })),
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
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError)
  })

  it('preserves exact decimal strings and actual currency precision', () => {
    expect(exactEvidenceAmount('-9007199254740993.01')).toBe('-9007199254740993.01')
    expect(evidenceCurrencyExponent('JPY')).toBe(0)
    expect(evidenceCurrencyExponent('KWD')).toBe(3)
    expect(() => exactEvidenceAmount(97)).toThrow()
    expect(() => exactEvidenceAmount('1.2oops')).toThrow()
    expect(() => balanceEvidence({ ...transaction, id: Number.MAX_SAFE_INTEGER + 1 })).toThrow(
      'unsafe',
    )
  })
})
