// tests/affirm-tools.test.ts
//
// The four read tools. Three things are actually being protected here:
//
//   1. They share the CONNECTOR's fetch and projection code, so a tool and a
//      sync cannot disagree about what Affirm said.
//   2. `get_affirm_charge` requests `expand=checkout`, which is the only way
//      `checkout.metadata.transaction_id` — the Shopify PaymentSession id — is
//      available. That is the order-recognition fallback.
//   3. Nothing leaks a customer's name, email or address. An expanded Affirm
//      checkout is full of them, and a tool result is agent context.

import { beforeEach, describe, expect, it } from 'vitest'
import getAffirmCharge from '../src/tools/get_affirm_charge.tool.server'
import listAffirmCharges from '../src/tools/list_affirm_charges.tool.server'
import listAffirmSettlementEvents from '../src/tools/list_affirm_settlement_events.tool.server'
import listAffirmSettlements from '../src/tools/list_affirm_settlements.tool.server'

let requests: URL[] = []
let responses: Response[] = []

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  requests = []
  responses = []
  // The ambient connection a tool invocation is given.
  ;(globalThis as any).AUXX_SERVER_SDK = {
    getConnection: () => ({
      type: 'secret',
      value: '',
      fields: { merchant_id: '07JVNWWI5PZM8L7Y', public_key: 'pub', private_key: 'priv' },
    }),
  }
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requests.push(new URL(String(input)))
    const next = responses.shift()
    if (!next) throw new Error(`Unexpected Affirm request: ${String(input)}`)
    return next
  }) as typeof fetch
})

/** ✔ REAL. `GET /settlements/daily`, the Sep-15 deposit, verbatim. */
const SUMMARY = {
  total_settled: 357930,
  currency: 'USD',
  total_fees: -16075,
  date: '2026-09-15',
  account_last_four: '6670',
  total_refunds: 0,
  total_sales: 374005,
  deposit_id: 'I5Y8PHAWWSSS2WJ',
  id: 'a28fbb9b-2f7c-4880-a938-3ed6d32709d8',
}

/**
 * ✔ REAL. `GET /settlements/events`, its one member, verbatim. `fees` is the
 * WHOLE fee and `transaction_fees` a component OF it: 374005 + -16075 = 357930.
 */
const MEMBER_EVENT = {
  order_id: 'rPhjzMna9vESRYlOF0hLADbBL',
  merchant_id: '07JVNWWI5PZM8L7Y',
  channel: 'Affirm Direct',
  deposit_id: 'I5Y8PHAWWSSS2WJ',
  initiating_merchant_id: '07JVNWWI5PZM8L7Y',
  mdr: 0.0429,
  date: '2026-09-15',
  total_settled: 357930,
  effective_date: '2026-09-14T19:28:14Z',
  id: '53f9cad7-b293-4918-b7d4-6716c64e21de',
  transaction_id: 'oTzSBZG2TU5WGc28',
  event_type: 'loan_capture',
  transaction_fees: -30,
  original_loan_amount: 374005,
  sales: 374005,
  charge_created_date: '2026-09-14',
  refunds: 0,
  transaction_event_id: 'DUUX0OUUPNABFT9G',
  fees: -16075,
  purchase_id: 'CPDZ-ANRU',
  currency: 'USD',
}

describe('list_affirm_settlements', () => {
  it('projects the real deposit, keeping Affirm’s negative fee sign', async () => {
    responses.push(jsonResponse({ data: [SUMMARY], next_page: null }))

    const result = await listAffirmSettlements({ after: '2026-09-08' })

    expect(requests[0]!.pathname).toMatch(/\/settlements\/daily$/)
    expect(requests[0]!.searchParams.get('after')).toBe('2026-09-08')
    expect(requests[0]!.searchParams.get('merchant_id')).toBe('07JVNWWI5PZM8L7Y')
    expect(result.settlements[0]).toEqual({
      depositId: 'I5Y8PHAWWSSS2WJ',
      date: '2026-09-15',
      status: 'paid',
      totalSettled: '3579.30',
      currency: 'USD',
      currencyExponent: 2,
      accountLastFour: '6670',
      reportedSales: '3740.05',
      // A reported zero is a zero, not an absence.
      reportedRefunds: '0.00',
      reportedFees: '-160.75',
    })
    expect(result.hasMore).toBe(false)
    expect(result.rejected).toBe(0)
  })

  it('counts an unreadable row instead of inventing one', async () => {
    responses.push(jsonResponse({ data: [{ deposit_id: 'X' }], next_page: 'more' }))

    const result = await listAffirmSettlements({})
    expect(result.settlements).toEqual([])
    expect(result.rejected).toBe(1)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe('more')
    expect(result.summary).toMatch(/could not be read/)
  })
})

describe('list_affirm_settlement_events', () => {
  it('widens the window and filters the deposit locally, saying so', async () => {
    responses.push(
      jsonResponse({
        data: [MEMBER_EVENT, { ...MEMBER_EVENT, id: 'OTHER', deposit_id: 'PMDM5BIIZE6JASG' }],
        next_page: null,
      })
    )

    const result = await listAffirmSettlementEvents({
      depositId: 'I5Y8PHAWWSSS2WJ',
      after: '2026-09-15',
    })

    // Affirm offers no deposit filter, so the request is a widened DATE window.
    expect(requests[0]!.searchParams.get('after')).toBe('2026-09-14')
    expect(requests[0]!.searchParams.get('before')).toBe('2026-09-16')
    expect(requests[0]!.searchParams.get('deposit_id')).toBeNull()

    expect(result.events).toHaveLength(1)
    // fee = -(-16075). `transaction_fees: -30` is part of that fee, not another
    // 30 cents on top of it.
    expect(result.events[0]!.fee).toBe('160.75')
    expect(result.events[0]!.gross).toBe('3740.05')
    // The event's own `effective_date`, not the deposit's settlement date.
    expect(result.events[0]!.date).toBe('2026-09-14T19:28:14Z')
    expect(result.events[0]!.orderId).toBe('rPhjzMna9vESRYlOF0hLADbBL')
    expect(result.scannedAfter).toBe('2026-09-14')
    expect(result.scannedBefore).toBe('2026-09-16')
    expect(result.complete).toBe(true)
  })

  it('reports an unfinished window as incomplete rather than as a total', async () => {
    responses.push(jsonResponse({ data: [MEMBER_EVENT], next_page: 'page2' }))

    const result = await listAffirmSettlementEvents({ depositId: 'I5Y8PHAWWSSS2WJ' })
    expect(result.complete).toBe(false)
    expect(result.hasMore).toBe(true)
    expect(result.summary).toMatch(/MORE PAGES REMAIN/)
  })

  it('returns events with no deposit, and flags an unmapped event type', async () => {
    responses.push(
      jsonResponse({
        data: [
          {
            id: 'NEWTHING00000001',
            date: '2026-09-15',
            event_type: 'something_affirm_added_later',
            total_settled: 0,
          },
        ],
        next_page: null,
      })
    )

    const result = await listAffirmSettlementEvents({})
    expect(result.events[0]!.depositId).toBeNull()
    expect(result.events[0]!.type).toBe('unknown')
    expect(result.events[0]!.providerType).toBe('something_affirm_added_later')
    expect(result.summary).toMatch(/does not map/)
  })
})

describe('charges', () => {
  /** Structure from probe §4. The real response also carried PII; this does not. */
  const CHARGE = {
    id: 'CPDZ-ANRU',
    order_id: 'rPhjzMna9vESRYlOF0hLADbBL',
    amount: 374005,
    status: 'captured',
    currency: 'USD',
    created: '2026-09-14T19:28:12Z',
    checkout_id: 'HZN3BCP2ZTFZK6T7',
    events: [
      { type: 'auth', amount: 374005, id: '243EYFJGASKXX8BN', created: '2026-09-14T19:28:12Z' },
    ],
    checkout: {
      order_id: 'rPhjzMna9vESRYlOF0hLADbBL',
      metadata: {
        platform_type: 'Shopify',
        shopify: true,
        transaction_id: 'gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL',
        reference: 'rPhjzMna9vESRYlOF0hLADbBL',
      },
      // The parts a real expanded checkout carries and this app must not surface.
      billing: { name: { full: 'A Real Person' }, email: 'person@example.com' },
      shipping: { address: { line1: '1 Real Street' } },
    },
  }

  it('list_affirm_charges does NOT expand the checkout', async () => {
    responses.push(jsonResponse({ transactions: [CHARGE], has_next: false, has_prev: false }))

    const result = await listAffirmCharges({ after: '2026-09-01T00:00:00Z' })

    expect(requests[0]!.searchParams.get('expand')).toBeNull()
    expect(requests[0]!.searchParams.get('transaction_type')).toBe('charge')
    // ISO in, epoch milliseconds out.
    expect(requests[0]!.searchParams.get('after_timestamp')).toBe(
      String(Date.parse('2026-09-01T00:00:00Z'))
    )
    expect(result.charges[0]!.amount).toBe('3740.05')
    expect(result.charges[0]!.eventCount).toBe(1)
    expect(JSON.stringify(result)).not.toMatch(/A Real Person|person@example\.com|Real Street/)
  })

  it('get_affirm_charge expands the checkout and surfaces the Shopify payment session', async () => {
    responses.push(jsonResponse(CHARGE))

    const result = await getAffirmCharge({ chargeId: 'CPDZ-ANRU' })

    expect(requests[0]!.pathname).toMatch(/\/transactions\/CPDZ-ANRU$/)
    // Build plan §6 rule 4: this is what makes the fallback lookup possible.
    expect(requests[0]!.searchParams.get('expand')).toBe('checkout')
    expect(result.shopifyPaymentSessionId).toBe(
      'gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL'
    )
    expect(result.platformType).toBe('Shopify')
    expect(result.events[0]).toEqual({
      id: '243EYFJGASKXX8BN',
      type: 'auth',
      amount: '3740.05',
      created: '2026-09-14T19:28:12Z',
    })
    // Not one byte of the customer, even though the expanded payload had it.
    expect(JSON.stringify(result)).not.toMatch(/A Real Person|person@example\.com|Real Street/)
  })

  it('reports a checkout order id that disagrees with the charge instead of picking one', async () => {
    responses.push(
      jsonResponse({
        ...CHARGE,
        checkout: { ...CHARGE.checkout, order_id: 'somethingelse' },
      })
    )

    const result = await getAffirmCharge({ chargeId: 'CPDZ-ANRU' })
    expect(result.summary).toMatch(/differs from the charge order id/)
  })
})
