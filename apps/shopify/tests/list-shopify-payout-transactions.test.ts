// apps/shopify/tests/list-shopify-payout-transactions.test.ts

import { InvalidInputError, RateLimitError, UpstreamServiceError } from '@auxx/sdk/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import listShopifyPayoutTransactions from '../src/tools/list-shopify-payout-transactions.tool.server'
import { GRANTED_WITH_PAYOUTS, stubConnection, stubFetch } from './payments-test-support'

const PAYOUT_ID = '623721858'

function txn(overrides: Record<string, unknown>) {
  return {
    id: 1,
    type: 'charge',
    test: false,
    payout_id: Number(PAYOUT_ID),
    payout_status: 'paid',
    currency: 'USD',
    amount: '102.50',
    fee: '3.27',
    net: '99.23',
    source_id: 1006917261,
    source_type: 'charge',
    source_order_id: 5512033210,
    source_order_transaction_id: 1006917261,
    processed_at: '2026-08-30T15:20:00-04:00',
    ...overrides,
  }
}

const NEXT =
  'https://test-shop.myshopify.com/admin/api/2024-10/shopify_payments/balance/transactions.json?limit=250&page_info=xyz'

describe('list_shopify_payout_transactions', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('drains every page, converts to minor units, and stringifies or nulls the source ids', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    const fetched = stubFetch([
      { body: { transactions: [txn({ id: 1 })] }, next: NEXT },
      {
        body: {
          transactions: [
            txn({
              id: 2,
              type: 'refund',
              amount: '-25.00',
              fee: '0.00',
              net: '-25.00',
              source_type: 'refund',
            }),
            // A payout row carries no source at all.
            txn({
              id: 3,
              type: 'payout',
              amount: '-76.73',
              fee: '0.00',
              net: '-76.73',
              source_id: null,
              source_type: null,
              source_order_id: null,
              source_order_transaction_id: null,
            }),
          ],
        },
      },
    ])

    const { transactions } = await listShopifyPayoutTransactions({ payoutId: PAYOUT_ID })

    expect(fetched.calls).toBe(2)
    const first = new URL(fetched.urls[0]!)
    expect(first.pathname).toBe('/admin/api/2024-10/shopify_payments/balance/transactions.json')
    expect(first.searchParams.get('payout_id')).toBe(PAYOUT_ID)
    expect(first.searchParams.get('limit')).toBe('250')
    expect(fetched.urls[1]).toBe(NEXT)

    expect(transactions).toHaveLength(3)
    expect(transactions[0]).toEqual({
      id: '1',
      type: 'charge',
      test: false,
      amountMinor: 10250,
      feeMinor: 327,
      netMinor: 9923,
      sourceId: '1006917261',
      sourceType: 'charge',
      sourceOrderId: '5512033210',
      sourceOrderTransactionId: '1006917261',
      processedAt: '2026-08-30T15:20:00-04:00',
    })
    expect(transactions[1]!.amountMinor).toBe(-2500)
    expect(transactions[1]!.netMinor).toBe(-2500)
    expect(transactions[2]).toMatchObject({
      type: 'payout',
      amountMinor: -7673,
      sourceId: null,
      sourceType: null,
      sourceOrderId: null,
      sourceOrderTransactionId: null,
    })
  })

  it('refuses on a mid-pagination 429 instead of returning a partial payout', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    const fetched = stubFetch([
      { body: { transactions: [txn({ id: 1 })] }, next: NEXT },
      { status: 429, body: {} },
    ])

    const err = await listShopifyPayoutTransactions({ payoutId: PAYOUT_ID }).catch((e) => e)
    expect(err).toBeInstanceOf(RateLimitError)
    expect((err as RateLimitError).retryAfterSeconds).toBe(2)
    expect(fetched.calls).toBe(2)
  })

  it('refuses when Shopify hands back a row from a different payout', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    stubFetch([{ body: { transactions: [txn({ id: 1 }), txn({ id: 9, payout_id: 1 })] } }])

    await expect(listShopifyPayoutTransactions({ payoutId: PAYOUT_ID })).rejects.toBeInstanceOf(
      UpstreamServiceError,
    )
  })

  it('refuses when the response has no transactions collection', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    stubFetch([{ body: { errors: 'Not Found' } }])

    await expect(listShopifyPayoutTransactions({ payoutId: PAYOUT_ID })).rejects.toBeInstanceOf(
      UpstreamServiceError,
    )
  })

  it('rejects a non-numeric payout id before touching the connection', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    const fetched = stubFetch([])

    await expect(
      listShopifyPayoutTransactions({ payoutId: 'gid://shopify/Payout/1' }),
    ).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetched.calls).toBe(0)
  })
})
