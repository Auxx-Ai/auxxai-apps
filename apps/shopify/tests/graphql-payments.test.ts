// apps/shopify/tests/graphql-payments.test.ts

import type { ConnectorRecord } from '@auxx/sdk/data-connectors'
import { InsufficientPermissionsError } from '@auxx/sdk/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { balanceEvidence, payoutEvidence } from '../src/blocks/shopify/shared/payments-evidence'
import {
  type GqlBalanceTransaction,
  type GqlPayout,
  toRawBalanceTransaction,
  toRawPayout,
} from '../src/graphql/payments'
import shopifySync from '../src/shopify.connector.server'
import { connection, stubGraphql } from './graphql-test-support'

const ACCOUNT = 'gid://shopify/ShopifyPaymentsAccount/777'
const money = (amount: string) => ({ amount })

const payoutNode: GqlPayout = {
  legacyResourceId: '10',
  status: 'PAID',
  // 20:00 in Los Angeles is the next UTC day; REST `date` is the UTC one.
  issuedAt: '2026-09-11T20:00:00-07:00',
  net: { amount: '97.00', currencyCode: 'USD' },
  summary: {
    adjustmentsFee: money('0.00'),
    adjustmentsGross: money('-1.50'),
    chargesFee: money('3.00'),
    chargesGross: money('100.00'),
    refundsFee: money('0.00'),
    refundsFeeGross: money('0.00'),
    reservedFundsFee: money('0.00'),
    reservedFundsGross: money('0.00'),
    retriedPayoutsFee: money('0.00'),
    retriedPayoutsGross: money('1.50'),
  },
}

const transactionNode: GqlBalanceTransaction = {
  id: 'gid://shopify/ShopifyPaymentsBalanceTransaction/21',
  type: 'CHARGE',
  test: false,
  associatedPayout: { id: 'gid://shopify/ShopifyPaymentsPayout/10', status: 'PAID' },
  amount: { amount: '100.00', currencyCode: 'USD' },
  fee: money('3.00'),
  net: money('97.00'),
  sourceId: '31',
  sourceType: 'CHARGE',
  associatedOrder: { id: 'gid://shopify/Order/41' },
  sourceOrderTransactionId: '51',
  transactionDate: '2026-09-11T10:00:00Z',
}

function account(key: 'payouts' | 'balanceTransactions', nodes: unknown[], next?: string) {
  const pageInfo = { hasNextPage: next !== undefined, endCursor: next ?? null }
  return { body: { data: { shopifyPaymentsAccount: { id: ACCOUNT, [key]: { nodes, pageInfo } } } } }
}

function run(streamKey: string, state: Record<string, unknown> = {}) {
  return shopifySync({ streamKey, mode: 'incremental', state, config: {}, connection })
}

afterEach(() => vi.unstubAllGlobals())

describe('toRawPayout', () => {
  it('adapts a payout into the REST shape with the UTC issue date', () => {
    expect(toRawPayout(payoutNode)).toEqual({
      id: 10,
      status: 'paid',
      date: '2026-09-12',
      currency: 'USD',
      amount: '97.00',
      summary: {
        adjustments_fee_amount: '0.00',
        adjustments_gross_amount: '-1.50',
        charges_fee_amount: '3.00',
        charges_gross_amount: '100.00',
        refunds_fee_amount: '0.00',
        refunds_gross_amount: '0.00',
        reserved_funds_fee_amount: '0.00',
        reserved_funds_gross_amount: '0.00',
        retried_payouts_fee_amount: '0.00',
        retried_payouts_gross_amount: '1.50',
      },
    })
  })

  it('maps every known status and throws on an unknown one', () => {
    for (const [gql, rest] of [
      ['SCHEDULED', 'scheduled'],
      ['IN_TRANSIT', 'in_transit'],
      ['PAID', 'paid'],
      ['FAILED', 'failed'],
      ['CANCELED', 'canceled'],
    ]) {
      expect(toRawPayout({ ...payoutNode, status: gql! }).status).toBe(rest)
    }
    expect(() => toRawPayout({ ...payoutNode, status: 'ACTION_REQUIRED' })).toThrow('status')
    expect(() => toRawPayout({ ...payoutNode, status: 'paid' })).toThrow('status')
  })

  it('refuses a missing or unparseable issue date', () => {
    expect(() => toRawPayout({ ...payoutNode, issuedAt: null })).toThrow('issue date')
    expect(() => toRawPayout({ ...payoutNode, issuedAt: 'soon' })).toThrow('issue date')
  })

  it('passes money verbatim and keeps exact ids for evidence to judge', () => {
    const raw = toRawPayout({ ...payoutNode, net: { amount: '0.10000', currencyCode: 'JPY' } })
    expect(raw).toMatchObject({ amount: '0.10000', currency: 'JPY' })
    expect(toRawPayout({ ...payoutNode, legacyResourceId: '9007199254740993' }).id).toBe(
      '9007199254740993',
    )
    expect(() =>
      payoutEvidence(toRawPayout({ ...payoutNode, legacyResourceId: 'gid://x/1' })),
    ).toThrow('source ID')
  })
})

describe('toRawBalanceTransaction', () => {
  it('adapts a balance transaction into the REST shape', () => {
    expect(toRawBalanceTransaction(transactionNode)).toEqual({
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
    })
  })

  it('maps transfers to REST payout types and lets every other type fall into unknown', () => {
    for (const [gql, providerType, activity] of [
      ['TRANSFER', 'payout', 'outgoing_transfer'],
      ['TRANSFER_FAILURE', 'payout_failure', 'returned_transfer'],
      ['TRANSFER_CANCEL', 'payout_cancellation', 'returned_transfer'],
      ['CHARGE', 'charge', 'charge'],
      ['REFUND', 'refund', 'refund'],
      ['ADJUSTMENT', 'adjustment', 'adjustment'],
      ['SHOPIFY_COLLECTIVE_DEBIT', 'shopify_collective_debit', 'unknown'],
      ['DISPUTE', 'dispute', 'unknown'],
    ]) {
      const raw = toRawBalanceTransaction({ ...transactionNode, type: gql })
      expect(raw.type).toBe(providerType)
      expect(balanceEvidence(raw)).toMatchObject({ providerType, type: activity })
    }
  })

  it('nulls an unassigned payout and order, and never accepts a gid of the wrong type', () => {
    const raw = toRawBalanceTransaction({
      ...transactionNode,
      associatedPayout: null,
      associatedOrder: null,
      sourceId: null,
      sourceType: null,
      sourceOrderTransactionId: null,
    })
    expect(raw).toMatchObject({
      payout_id: null,
      payout_status: null,
      source_order_id: null,
      source_id: null,
      source_type: null,
      source_order_transaction_id: null,
    })
    const wrong = toRawBalanceTransaction({
      ...transactionNode,
      associatedPayout: { id: 'gid://shopify/Order/10', status: 'PAID' },
    })
    expect(() => balanceEvidence(wrong)).toThrow('source ID')
  })
})

describe('shopifySync payments streams over GraphQL', () => {
  it('restarts a legacy v2 or string cursor as a fresh scan without a request', async () => {
    const calls = stubGraphql([])
    for (const cursor of [
      { version: 2, streamKey: 'payout', scanId: 'old', startedAt: 'x', phase: 'members' },
      'page_info_token',
    ]) {
      const result = await run('payout', { cursor })
      expect(result.records).toEqual([])
      expect(result.nextState.cursor).toMatchObject({ version: 3, phase: 'headers', pageIndex: 0 })
      expect((result.nextState.cursor as { scanId: string }).scanId).not.toBe('old')
    }
    expect(calls).toHaveLength(0)
  })

  it('reads a header, then its members by payments_transfer_id', async () => {
    const calls = stubGraphql([
      account('payouts', [payoutNode], 'payout-cursor'),
      account('balanceTransactions', [transactionNode]),
    ])
    const seed = await run('payout')
    const header = await run('payout', seed.nextState)
    expect(calls[0]!.url).toBe('https://test-shop.myshopify.com/admin/api/2026-07/graphql.json')
    expect(calls[0]!.body.query).toContain('payouts(first: 1')
    expect(calls[0]!.body.variables).toEqual({ after: null, query: null })
    expect((header.records as ConnectorRecord[])[0]).toMatchObject({
      externalId: '10',
      fields: { amount: '97.00', issuedOn: '2026-09-12', externalAccountId: ACCOUNT },
    })

    const members = await run('payout', header.nextState)
    expect(calls[1]!.body.query).toContain('balanceTransactions(first: 250')
    expect(calls[1]!.body.variables).toEqual({ after: null, query: 'payments_transfer_id:10' })
    expect((members.records as ConnectorRecord[])[0]!.fields).toMatchObject({
      membership: {
        complete: true,
        entries: [{ id: '21', payoutId: '10', sourceOrderId: '41', net: '97.00' }],
      },
    })
    expect(members.nextState.cursor).toMatchObject({
      phase: 'headers',
      outerCursor: 'payout-cursor',
      headerIndex: 1,
    })
  })

  it('pages the balance stream by endCursor sorted by processing date', async () => {
    const calls = stubGraphql([
      account('balanceTransactions', [transactionNode], 'bt-1'),
      account('balanceTransactions', [
        { ...transactionNode, id: 'gid://shopify/ShopifyPaymentsBalanceTransaction/22' },
      ]),
    ])
    const seed = await run('balance_transaction')
    const first = await run('balance_transaction', seed.nextState)
    expect(calls[0]!.body.query).toContain('sortKey: PROCESSED_AT')
    expect(calls[0]!.body.variables).toEqual({ after: null })
    expect((first.records as ConnectorRecord[]).map((r) => r.externalId)).toEqual(['21'])
    const second = await run('balance_transaction', first.nextState)
    expect(calls[1]!.body.variables).toEqual({ after: 'bt-1' })
    expect((second.records as ConnectorRecord[]).map((r) => r.externalId)).toEqual(['22'])
    expect(second.nextState).toEqual({ backfillComplete: true })
  })

  it('keeps the cursor on a THROTTLED response', async () => {
    stubGraphql([
      {
        body: {
          errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }],
          extensions: {
            cost: {
              requestedQueryCost: 300,
              throttleStatus: { currentlyAvailable: 100, restoreRate: 100 },
            },
          },
        },
      },
    ])
    const seed = await run('balance_transaction')
    const result = await run('balance_transaction', seed.nextState)
    expect(result).toEqual({
      records: [],
      nextState: { cursor: seed.nextState.cursor },
      rateLimited: { retryAfterMs: 2000 },
    })
  })

  it('propagates a member-phase ACCESS_DENIED instead of recording a diagnostic', async () => {
    stubGraphql([
      account('payouts', [payoutNode]),
      { body: { errors: [{ message: 'denied', extensions: { code: 'ACCESS_DENIED' } }] } },
    ])
    const seed = await run('payout')
    const header = await run('payout', seed.nextState)
    await expect(run('payout', header.nextState)).rejects.toBeInstanceOf(
      InsufficientPermissionsError,
    )
  })

  it('records an unknown payout status as a rejected header and skips its membership', async () => {
    const calls = stubGraphql([account('payouts', [{ ...payoutNode, status: 'ACTION_REQUIRED' }])])
    const seed = await run('payout')
    const result = await run('payout', seed.nextState)
    expect((result.records as ConnectorRecord[])[0]).toMatchObject({
      externalId: expect.stringMatching(/^rejected:/),
      fields: {
        rejectionReason: expect.stringContaining('unknown payout status'),
        raw: { status: 'ACTION_REQUIRED' },
      },
    })
    expect(result.nextState).toEqual({ backfillComplete: true })
    expect(calls).toHaveLength(1)
  })
})
