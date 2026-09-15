// apps/shopify/tests/list-shopify-payouts.test.ts

import {
  InsufficientPermissionsError,
  InvalidInputError,
  UpstreamServiceError,
} from '@auxx/sdk/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import listShopifyPayouts from '../src/tools/list-shopify-payouts.tool.server'
import {
  GRANTED_WITH_PAYOUTS,
  GRANTED_WITHOUT_PAYOUTS,
  stubConnection,
  stubFetch,
} from './payments-test-support'

const SUMMARY = {
  adjustments_fee_amount: '0.00',
  adjustments_gross_amount: '0.00',
  charges_fee_amount: '123.45',
  charges_gross_amount: '4347.00',
  refunds_fee_amount: '0.00',
  refunds_gross_amount: '-100.00',
  reserved_funds_fee_amount: '0.00',
  reserved_funds_gross_amount: '0.00',
  retried_payouts_fee_amount: '0.00',
  retried_payouts_gross_amount: '0.00',
}

// Newest first, as Shopify serves them.
const PAGE_ONE = [
  {
    id: 300,
    status: 'paid',
    date: '2026-09-03',
    currency: 'USD',
    amount: '4123.55',
    summary: SUMMARY,
  },
  {
    id: 200,
    status: 'in_transit',
    date: '2026-09-02',
    currency: 'USD',
    amount: '0.10',
    summary: SUMMARY,
  },
]
const PAGE_TWO = [
  {
    id: 100,
    status: 'paid',
    date: '2026-09-01',
    currency: 'USD',
    amount: '19.99',
    summary: SUMMARY,
  },
]

const NEXT =
  'https://test-shop.myshopify.com/admin/api/2024-10/shopify_payments/payouts.json?limit=250&page_info=abc'

describe('list_shopify_payouts', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('drains every page by the Link header, converts to minor units, and returns oldest first', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    const fetched = stubFetch([
      { body: { payouts: PAGE_ONE }, next: NEXT },
      { body: { payouts: PAGE_TWO } },
    ])

    const { payouts } = await listShopifyPayouts({
      since: '2026-09-01',
      until: '2026-09-30',
      status: 'paid',
    })

    expect(fetched.calls).toBe(2)
    const first = new URL(fetched.urls[0]!)
    expect(first.pathname).toBe('/admin/api/2024-10/shopify_payments/payouts.json')
    expect(first.searchParams.get('date_min')).toBe('2026-09-01')
    expect(first.searchParams.get('date_max')).toBe('2026-09-30')
    expect(first.searchParams.get('status')).toBe('paid')
    expect(first.searchParams.get('limit')).toBe('250')
    // The cursor URL is followed verbatim; Shopify rejects extra params beside page_info.
    expect(fetched.urls[1]).toBe(NEXT)

    expect(payouts.map((p) => p.id)).toEqual(['100', '200', '300'])
    expect(payouts[0]).toEqual({
      id: '100',
      status: 'paid',
      date: '2026-09-01',
      currency: 'USD',
      amountMinor: 1999,
      summary: {
        adjustmentsFeeMinor: 0,
        adjustmentsGrossMinor: 0,
        chargesFeeMinor: 12345,
        chargesGrossMinor: 434700,
        refundsFeeMinor: 0,
        refundsGrossMinor: -10000,
        reservedFundsFeeMinor: 0,
        reservedFundsGrossMinor: 0,
        retriedPayoutsFeeMinor: 0,
        retriedPayoutsGrossMinor: 0,
      },
    })
    // 0.10 * 100 is 10.000000000000002 in floating point; the rounding must land on 10.
    expect(payouts[1]!.amountMinor).toBe(10)
    expect(payouts[2]!.amountMinor).toBe(412355)
  })

  it('omits date_max and status from the query when not given', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    const fetched = stubFetch([{ body: { payouts: [] } }])

    const { payouts } = await listShopifyPayouts({ since: '2026-09-01' })

    expect(payouts).toEqual([])
    const url = new URL(fetched.urls[0]!)
    expect(url.searchParams.has('date_max')).toBe(false)
    expect(url.searchParams.has('status')).toBe(false)
  })

  it('refuses on a mid-pagination error instead of returning the first page', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    const fetched = stubFetch([
      { body: { payouts: PAGE_ONE }, next: NEXT },
      { status: 502, body: { errors: 'bad gateway' } },
    ])

    await expect(listShopifyPayouts({ since: '2026-09-01' })).rejects.toBeInstanceOf(
      UpstreamServiceError,
    )
    expect(fetched.calls).toBe(2)
  })

  it('refuses when the network drops between pages', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    stubFetch([
      { body: { payouts: PAGE_ONE }, next: NEXT },
      { reject: new Error('socket hang up') },
    ])

    await expect(listShopifyPayouts({ since: '2026-09-01' })).rejects.toBeInstanceOf(
      UpstreamServiceError,
    )
  })

  it('refuses before any HTTP when the recorded grant lacks the payouts scope', async () => {
    stubConnection(GRANTED_WITHOUT_PAYOUTS)
    const fetched = stubFetch([])

    const err = await listShopifyPayouts({ since: '2026-09-01' }).catch((e) => e)
    expect(err).toBeInstanceOf(InsufficientPermissionsError)
    expect((err as InsufficientPermissionsError).requiredScopes).toEqual([
      'read_shopify_payments_payouts',
    ])
    expect(fetched.calls).toBe(0)
  })

  it('lets a connection with no recorded grant through and lets Shopify decide', async () => {
    stubConnection(undefined)
    const fetched = stubFetch([{ body: { payouts: PAGE_TWO } }])

    const { payouts } = await listShopifyPayouts({ since: '2026-09-01' })

    expect(fetched.calls).toBe(1)
    expect(payouts).toHaveLength(1)
  })

  it('rejects a malformed date or an inverted window before touching the connection', async () => {
    stubConnection(GRANTED_WITH_PAYOUTS)
    const fetched = stubFetch([])

    await expect(listShopifyPayouts({ since: '09/01/2026' })).rejects.toBeInstanceOf(
      InvalidInputError,
    )
    await expect(
      listShopifyPayouts({ since: '2026-09-30', until: '2026-09-01' }),
    ).rejects.toBeInstanceOf(InvalidInputError)
    expect(fetched.calls).toBe(0)
  })
})
