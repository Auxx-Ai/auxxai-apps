// tests/authorize-net-tools.test.ts
//
// No live probe has run; every fixture comes from the vendor reference's examples.

import { beforeEach, describe, expect, it } from 'vitest'
import getAuthorizeNetTransaction from '../src/tools/get_authorize_net_transaction.tool.server'
import listAuthorizeNetBatchTransactions from '../src/tools/list_authorize_net_batch_transactions.tool.server'
import listAuthorizeNetBatches from '../src/tools/list_authorize_net_batches.tool.server'
import listAuthorizeNetUnsettled from '../src/tools/list_authorize_net_unsettled.tool.server'

let requests: any[] = []
let responses: Response[] = []

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

const OK = { resultCode: 'Ok', message: [{ code: 'I00001', text: 'Successful.' }] }

beforeEach(() => {
  requests = []
  responses = []
  // The ambient connection a tool invocation is given.
  ;(globalThis as any).AUXX_SERVER_SDK = {
    getConnection: () => ({
      type: 'secret',
      value: '',
      fields: {
        api_login_id: '5KP3u95bQpv',
        transaction_key: '346HZ32z3fP4hTG2',
        environment: 'test',
      },
    }),
  }
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(init?.body ? JSON.parse(String(init.body)) : {})
    const next = responses.shift()
    if (!next) throw new Error('Unexpected Authorize.net request')
    return next
  }) as typeof fetch
})

/** The reference's eCheck batch, with statistics. */
const BATCH = {
  batchId: '10198080',
  settlementTimeUTC: '2014-10-24T18:48:19Z',
  settlementTimeLocal: '2014-10-24T16:18:19',
  settlementState: 'settledSuccessfully',
  paymentMethod: 'eCheck',
  statistics: [
    {
      accountType: 'eCheck',
      chargeAmount: '12.22',
      chargeCount: 1,
      refundAmount: '0',
      refundCount: 0,
      voidCount: 0,
      declineCount: 0,
      errorCount: 0,
      returnedItemAmount: '0',
      returnedItemCount: 0,
      chargebackAmount: '0',
      chargebackCount: 0,
    },
  ],
}

const BATCH_TRANSACTION = {
  transId: '12345',
  submitTimeUTC: '2009-05-30T09:00:00',
  submitTimeLocal: '2009-05-30T04:00:00',
  transactionStatus: 'settledSuccessfully',
  invoiceNumber: 'INV00001',
  firstName: 'John',
  lastName: 'Doe',
  amount: '2.00',
  accountType: 'Visa',
  accountNumber: 'XXXX1111',
  settleAmount: '2.00',
}

describe('list_authorize_net_batches', () => {
  it('projects a settled batch and sums its per-brand statistics', async () => {
    responses.push(jsonResponse({ batchList: [BATCH], messages: OK }))

    const result = await listAuthorizeNetBatches({ after: '2014-10-01', before: '2014-10-31' })

    expect(requests).toHaveLength(1)
    expect(result.batches).toHaveLength(1)
    expect(result.batches[0]).toMatchObject({
      batchId: '10198080',
      settledAt: '2014-10-24T18:48:19Z',
      settledOn: '2014-10-24',
      state: 'settledSuccessfully',
      paymentMethod: 'eCheck',
      // Authorize.net states no batch total; this is Σ over card brands.
      netAmount: '12.22',
      currency: 'USD',
    })
    expect(result.batches[0]!.perBrand[0]).toMatchObject({
      accountType: 'eCheck',
      chargeAmount: '12.22',
      chargeCount: 1,
    })
    expect(result.rejected).toBe(0)
    expect(result.hasMore).toBe(false)
    // The summary says the amounts are gross, because no fee exists on the wire.
    expect(result.summary).toMatch(/GROSS/)
  })

  it('counts an unreadable batch instead of inventing one', async () => {
    responses.push(
      jsonResponse({ batchList: [{ settlementState: 'settledSuccessfully' }], messages: OK })
    )

    const result = await listAuthorizeNetBatches({ after: '2014-10-01', before: '2014-10-31' })
    expect(result.batches).toEqual([])
    expect(result.rejected).toBe(1)
    expect(result.summary).toMatch(/could not be read/)
  })

  it('splits a range wider than the 31-day cap into consecutive windows', async () => {
    // 2026-01-01 → 2026-03-15 is 74 days: three calls, not one rejected request.
    responses.push(
      jsonResponse({ batchList: [BATCH], messages: OK }),
      jsonResponse({ batchList: [], messages: OK }),
      jsonResponse({ batchList: [], messages: OK }),
      jsonResponse({ batchList: [], messages: OK })
    )

    const result = await listAuthorizeNetBatches({ after: '2026-01-01', before: '2026-03-15' })

    expect(requests.length).toBeGreaterThanOrEqual(3)
    expect(result.batches).toHaveLength(1)
  })
})

describe('list_authorize_net_batch_transactions', () => {
  it('projects a batch member, preferring settleAmount', async () => {
    responses.push(
      jsonResponse({ transactions: [BATCH_TRANSACTION], totalNumInResultSet: 1, messages: OK })
    )

    const result = await listAuthorizeNetBatchTransactions({ batchId: '10198080' })

    expect(result.transactions[0]).toEqual({
      transId: '12345',
      submittedAt: '2009-05-30T09:00:00',
      status: 'settledSuccessfully',
      amount: '2.00',
      currency: 'USD',
      invoiceNumber: 'INV00001',
      accountType: 'Visa',
      accountNumber: 'XXXX1111',
      hasReturnedItems: null,
    })
    expect(result.total).toBe(1)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
    // No fee column exists, on the row or in the rollup.
    expect(result.transactions[0]).not.toHaveProperty('fee')
    expect(JSON.stringify(result)).not.toMatch(/John|Doe/)
  })

  it('counts an unreadable row and keeps the rest of the batch', async () => {
    responses.push(
      jsonResponse({
        transactions: [BATCH_TRANSACTION, { transactionStatus: 'settledSuccessfully' }],
        totalNumInResultSet: 2,
        messages: OK,
      })
    )

    const result = await listAuthorizeNetBatchTransactions({ batchId: '10198080' })
    expect(result.transactions).toHaveLength(1)
    expect(result.rejected).toBe(1)
  })

  it('round-trips its cursor as a 1-based page number', async () => {
    responses.push(
      jsonResponse({ transactions: [BATCH_TRANSACTION], totalNumInResultSet: 3, messages: OK })
    )

    const first = await listAuthorizeNetBatchTransactions({ batchId: '10198080', limit: 1 })
    expect(first.hasMore).toBe(true)
    expect(first.nextCursor).toBe('p2')

    responses.push(
      jsonResponse({ transactions: [BATCH_TRANSACTION], totalNumInResultSet: 3, messages: OK })
    )
    const second = await listAuthorizeNetBatchTransactions({
      batchId: '10198080',
      limit: 1,
      cursor: first.nextCursor!,
    })

    // Page 2 was actually asked for, not page 1 again.
    expect(JSON.stringify(requests[1])).toContain('2')
    expect(second.nextCursor).toBe('p3')
    expect(second.hasMore).toBe(true)
  })
})

describe('get_authorize_net_transaction', () => {
  /** Structure from the API reference, PII included — the real response carries it. */
  const DETAIL = {
    transId: '12345',
    refTransId: '12345',
    submitTimeUTC: '2010-08-30T17:49:20.757Z',
    transactionType: 'authCaptureTransaction',
    transactionStatus: 'settledSuccessfully',
    authCode: '000000',
    batch: {
      batchId: '10198080',
      settlementTimeUTC: '2010-08-30T17:49:20.757Z',
      settlementState: 'settledSuccessfully',
    },
    order: {
      invoiceNumber: 'INV00001',
      description: 'some description',
      purchaseOrderNumber: 'PO000001',
    },
    authAmount: '2.00',
    settleAmount: '2.00',
    payment: { creditCard: { cardNumber: 'XXXX1111', expirationDate: 'XXXX', cardType: 'Visa' } },
    networkTransId: '123456789KLNLN9H',
    // The parts this app must not surface.
    customer: { type: 'individual', id: 'ABC00001', email: 'mark@example.com' },
    billTo: { firstName: 'A Real', lastName: 'Person', address: '1 Real Street' },
    shipTo: { firstName: 'A Real', lastName: 'Person', address: '1 Real Street' },
  }

  it('surfaces the batch, the invoice number and the masked card, and nothing else', async () => {
    responses.push(jsonResponse({ transaction: DETAIL, messages: OK }))

    const result = await getAuthorizeNetTransaction({ transId: '12345' })

    expect(result.batchId).toBe('10198080')
    expect(result.invoiceNumber).toBe('INV00001')
    expect(result.authCode).toBe('000000')
    expect(result.cardNumber).toBe('XXXX1111')
    expect(result.settleAmount).toBe('2.00')
    expect(result.summary).toMatch(/monthly statement/)
    // Not one byte of the customer, even though the payload had it.
    expect(JSON.stringify(result)).not.toMatch(/A Real|Person|mark@example\.com|Real Street/)
  })
})

describe('list_authorize_net_unsettled', () => {
  it('projects what is captured but not yet batched', async () => {
    responses.push(
      jsonResponse({
        transactions: [
          {
            transId: '2149186960',
            submitTimeUTC: '2017-06-16T06:48:37Z',
            transactionStatus: 'capturedPendingSettlement',
            firstName: 'Ellen',
            lastName: 'Johnson',
            accountType: 'Mastercard',
            accountNumber: 'XXXX0015',
            settleAmount: 5,
            marketType: 'eCommerce',
            product: 'Card Not Present',
          },
          { transactionStatus: 'voided' },
        ],
        totalNumInResultSet: 2,
        messages: OK,
      })
    )

    const result = await listAuthorizeNetUnsettled({})

    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]).toMatchObject({
      transId: '2149186960',
      status: 'capturedPendingSettlement',
      // A JSON number is stringified, never rounded.
      amount: '5',
      marketType: 'eCommerce',
    })
    expect(result.rejected).toBe(1)
    expect(result.summary).toMatch(/not yet in the bank/)
    expect(JSON.stringify(result)).not.toMatch(/Ellen|Johnson/)
  })
})
