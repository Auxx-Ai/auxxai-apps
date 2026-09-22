// apps/quickbooks/tests/batch-quickbooks-operations.test.ts
import { z } from '@auxx/sdk/tools'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/blocks/quickbooks/shared/quickbooks-api', () => ({
  quickbooksApi: vi.fn(),
  quickbooksQuery: vi.fn(),
  quickbooksFault: (error: unknown) =>
    (error as { quickbooksFault?: unknown })?.quickbooksFault ?? null,
}))
vi.mock('../src/tools/shared/connection', () => ({
  getQuickbooksConnection: vi.fn(async () => ({
    credential: 'token',
    realmId: 'company-A',
    sandbox: true,
  })),
  invalidInput: (message: string) => {
    const err = new Error(message) as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  },
}))

import { quickbooksApi, quickbooksQuery } from '../src/blocks/quickbooks/shared/quickbooks-api'
import batch from '../src/tools/batch-quickbooks-operations.tool.server'
import { batchQuickbooksOperationsTool } from '../src/tools/batch-quickbooks-operations.tool'
import createBill from '../src/tools/create-quickbooks-bill.tool.server'
import createInvoice from '../src/tools/create-quickbooks-invoice.tool.server'
import createJournalEntry from '../src/tools/create-quickbooks-journal-entry.tool.server'
import createPayment from '../src/tools/create-quickbooks-payment.tool.server'
import findInvoice from '../src/tools/find-quickbooks-invoice.tool.server'
import findJournalEntry from '../src/tools/find-quickbooks-journal-entry.tool.server'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(quickbooksApi).mockReset()
})

const invoiceInput = {
  customerId: '58',
  lines: [{ itemId: '1', amountMinor: 1500, description: 'Widget' }],
  docNumber: 'AUXX-INV-1',
  txnDate: '2026-09-15',
}
const rawInvoice = {
  Id: '244',
  DocNumber: 'AUXX-INV-1',
  TotalAmt: 15,
  Balance: 15,
  DueDate: '2026-10-15',
  SyncToken: '0',
  CustomerRef: { value: '58', name: 'Acme' },
  TxnDate: '2026-09-15',
}

describe('batch_quickbooks_operations', () => {
  it('posts one /batch call carrying the single tools’ bodies and the call-level requestId', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({ BatchItemResponse: [] })

    await batch({
      requestId: 'run-1',
      items: [{ bId: 'c1', operation: 'create', object: 'invoice', input: invoiceInput }],
    })

    // Same body the single tool sends for the same input.
    vi.mocked(quickbooksApi).mockResolvedValueOnce({ Invoice: rawInvoice })
    await createInvoice(invoiceInput)
    const singleBody = vi.mocked(quickbooksApi).mock.calls[1][3]?.body

    expect(quickbooksApi).toHaveBeenNthCalledWith(1, 'company-A', '/batch', 'token', {
      method: 'POST',
      sandbox: true,
      requestId: 'run-1',
      body: { BatchItemRequest: [{ bId: 'c1', operation: 'create', Invoice: singleBody }] },
    })
  })

  it('answers each item on its own: success, fault, and an item QuickBooks never answered', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      BatchItemResponse: [
        { bId: 'ok', Invoice: rawInvoice },
        {
          bId: 'dup',
          Fault: {
            type: 'ValidationFault',
            Error: [
              {
                Message: 'Duplicate Document Number Error',
                Detail: 'Duplicate Document Number Error : You must specify a different number.',
                code: '6140',
                element: '',
              },
            ],
          },
        },
        {
          bId: 'sys',
          Fault: { type: 'SystemFault', Error: [{ Message: 'Internal error', code: '10000' }] },
        },
      ],
    })

    const answer = await batch({
      items: [
        { bId: 'ok', operation: 'create', object: 'invoice', input: invoiceInput },
        {
          bId: 'dup',
          operation: 'create',
          object: 'invoice',
          input: { ...invoiceInput, docNumber: 'AUXX-INV-2' },
        },
        {
          bId: 'sys',
          operation: 'create',
          object: 'invoice',
          input: { ...invoiceInput, docNumber: 'AUXX-INV-3' },
        },
        {
          bId: 'lost',
          operation: 'create',
          object: 'invoice',
          input: { ...invoiceInput, docNumber: 'AUXX-INV-4' },
        },
      ],
    })

    expect(answer.items).toEqual([
      {
        bId: 'ok',
        operation: 'create',
        object: 'invoice',
        ok: true,
        result: {
          invoiceId: '244',
          docNumber: 'AUXX-INV-1',
          totalAmt: 15,
          balance: 15,
          dueDate: '2026-10-15',
          syncToken: '0',
        },
      },
      {
        bId: 'dup',
        operation: 'create',
        object: 'invoice',
        ok: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Duplicate Document Number Error : You must specify a different number.',
          fault: {
            type: 'ValidationFault',
            code: '6140',
            message: 'Duplicate Document Number Error',
            detail: 'Duplicate Document Number Error : You must specify a different number.',
            element: '',
          },
        },
      },
      {
        bId: 'sys',
        operation: 'create',
        object: 'invoice',
        ok: false,
        error: {
          code: 'UPSTREAM_ERROR',
          message: 'Internal error',
          fault: {
            type: 'SystemFault',
            code: '10000',
            message: 'Internal error',
            detail: null,
            element: null,
          },
        },
      },
      {
        bId: 'lost',
        operation: 'create',
        object: 'invoice',
        ok: false,
        error: expect.objectContaining({ code: 'UPSTREAM_ERROR', fault: null }),
      },
    ])
  })

  it('fails an invalid item locally and still sends the rest', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      BatchItemResponse: [{ bId: 'good', Invoice: rawInvoice }],
    })

    const answer = await batch({
      items: [
        {
          bId: 'bad',
          operation: 'create',
          object: 'invoice',
          input: { ...invoiceInput, lines: [{ itemId: '1', amountMinor: 12.5 }] },
        },
        { bId: 'good', operation: 'create', object: 'invoice', input: invoiceInput },
      ],
    })

    expect(answer.items[0]).toEqual({
      bId: 'bad',
      operation: 'create',
      object: 'invoice',
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: expect.stringContaining('amountMinor'),
        fault: null,
      },
    })
    expect(answer.items[1]).toMatchObject({ bId: 'good', ok: true })
    const sent = vi.mocked(quickbooksApi).mock.calls[0][3]?.body as {
      BatchItemRequest: { bId: string }[]
    }
    expect(sent.BatchItemRequest.map((r) => r.bId)).toEqual(['good'])
  })

  it('makes no HTTP call when every item failed validation', async () => {
    const answer = await batch({
      items: [{ bId: 'q', operation: 'query', object: 'invoice', docNumbers: [] }],
    })
    expect(answer.items[0]).toMatchObject({ ok: false, error: { code: 'INVALID_INPUT' } })
    expect(quickbooksApi).not.toHaveBeenCalled()
  })

  it('converts its input schema to JSON Schema, as catalog extraction does', () => {
    const schema = z.toJSONSchema(batchQuickbooksOperationsTool.inputs, {
      unrepresentable: 'any',
    }) as { properties: { items: { items: { anyOf: unknown[] } } } }
    expect(schema.properties.items.items.anyOf).toHaveLength(9)
  })

  it('refuses more than 30 items as a whole-call error', async () => {
    const items = Array.from({ length: 31 }, (_, i) => ({
      bId: `b${i}`,
      operation: 'query' as const,
      object: 'invoice' as const,
      docNumbers: [`D${i}`],
    }))
    await expect(batch({ items })).rejects.toThrow('at most 30')
    expect(quickbooksApi).not.toHaveBeenCalled()
    expect(batchQuickbooksOperationsTool.inputs.safeParse({ items }).success).toBe(false)
  })

  it('refuses a per-item requestId, a repeated bId, a long bId under requestId, and unqueryable objects', async () => {
    const query = { operation: 'query' as const, object: 'invoice' as const, docNumbers: ['D1'] }
    await expect(
      batch({
        items: [
          {
            bId: 'c',
            operation: 'create',
            object: 'invoice',
            input: { ...invoiceInput, requestId: 'x' } as typeof invoiceInput,
          },
        ],
      })
    ).rejects.toThrow('top level')
    await expect(
      batch({
        items: [
          { bId: 'a', ...query },
          { bId: 'a', ...query },
        ],
      })
    ).rejects.toThrow('repeated')
    await expect(
      batch({ requestId: 'r', items: [{ bId: 'elevenchars', ...query }] })
    ).rejects.toThrow('at most 10')
    await expect(
      batch({
        items: [{ bId: 'p', operation: 'query', object: 'payment' as never, docNumbers: ['1'] }],
      })
    ).rejects.toThrow('cannot query')
    expect(quickbooksApi).not.toHaveBeenCalled()
  })

  it('maps a query back per docNumber, in the single find tool’s shape', async () => {
    const other = { ...rawInvoice, Id: '245', DocNumber: 'AUXX-INV-2' }
    vi.mocked(quickbooksApi).mockResolvedValue({
      BatchItemResponse: [
        { bId: 'q', QueryResponse: { Invoice: [rawInvoice, other], maxResults: 2 } },
      ],
    })

    const answer = await batch({
      items: [
        {
          bId: 'q',
          operation: 'query',
          object: 'invoice',
          docNumbers: ['AUXX-INV-1', 'AUXX-INV-2', "O'Brien-1"],
        },
      ],
    })

    const sent = vi.mocked(quickbooksApi).mock.calls[0][3]?.body as {
      BatchItemRequest: { bId: string; Query: string }[]
    }
    expect(sent.BatchItemRequest).toEqual([
      {
        bId: 'q',
        Query:
          "SELECT * FROM Invoice WHERE DocNumber IN ('AUXX-INV-1', 'AUXX-INV-2', 'O''Brien-1') MAXRESULTS 1000",
      },
    ])

    // What find_quickbooks_invoice answers for each docNumber on its own.
    vi.mocked(quickbooksQuery).mockResolvedValueOnce([rawInvoice])
    const single = await findInvoice({ docNumber: 'AUXX-INV-1' })

    expect(answer.items[0]).toEqual({
      bId: 'q',
      operation: 'query',
      object: 'invoice',
      ok: true,
      result: {
        'AUXX-INV-1': single,
        'AUXX-INV-2': { invoices: [expect.objectContaining({ invoiceId: '245' })] },
        "O'Brien-1": { invoices: [] },
      },
    })
  })

  it('queries journal entries with the journal find’s escaping and answer shape', async () => {
    const rawJe = {
      Id: '184',
      DocNumber: 'JE-1',
      SyncToken: '0',
      Line: [
        {
          Id: '0',
          Amount: 10,
          DetailType: 'JournalEntryLineDetail',
          JournalEntryLineDetail: { PostingType: 'Debit', AccountRef: { value: '92' } },
        },
      ],
    }
    vi.mocked(quickbooksApi).mockResolvedValue({
      BatchItemResponse: [{ bId: 'j', QueryResponse: { JournalEntry: [rawJe] } }],
    })

    const answer = await batch({
      items: [{ bId: 'j', operation: 'query', object: 'journal', docNumbers: ['JE-1', "a'b"] }],
    })
    const sent = vi.mocked(quickbooksApi).mock.calls[0][3]?.body as {
      BatchItemRequest: { Query: string }[]
    }
    expect(sent.BatchItemRequest[0].Query).toContain("IN ('JE-1', 'a\\'b')")

    vi.mocked(quickbooksQuery).mockResolvedValueOnce([rawJe])
    const single = await findJournalEntry({ docNumber: 'JE-1' })
    expect(answer.items[0]).toMatchObject({ ok: true, result: { 'JE-1': single } })
  })

  it('answers a create exactly as the single create tool does, for every shape', async () => {
    const rawBill = { Id: '211', DocNumber: 'B-1', TxnDate: '2026-09-15', TotalAmt: 5, Balance: 5 }
    const rawPayment = { Id: '332', TotalAmt: 15, CustomerRef: { value: '58' }, SyncToken: '1' }
    const rawJe = { Id: '184', DocNumber: 'JE-1', SyncToken: '0', Line: [] }
    const billInput = { vendorId: '7', lines: [{ accountId: '60', amountMinor: 500 }] }
    const paymentInput = { customerId: '58', amountMinor: 1500, invoiceId: '244' }
    const jeInput = {
      lines: [
        { amountMinor: 100, postingType: 'Debit' as const, accountId: '1' },
        { amountMinor: 100, postingType: 'Credit' as const, accountId: '2' },
      ],
    }

    vi.mocked(quickbooksApi).mockResolvedValueOnce({
      BatchItemResponse: [
        { bId: 'i', Invoice: rawInvoice },
        { bId: 'b', Bill: rawBill },
        { bId: 'p', Payment: rawPayment },
        { bId: 'j', JournalEntry: rawJe },
      ],
    })
    const answer = await batch({
      items: [
        { bId: 'i', operation: 'create', object: 'invoice', input: invoiceInput },
        { bId: 'b', operation: 'create', object: 'bill', input: billInput },
        { bId: 'p', operation: 'create', object: 'payment', input: paymentInput },
        { bId: 'j', operation: 'create', object: 'journal', input: jeInput },
      ],
    })

    vi.mocked(quickbooksApi)
      .mockResolvedValueOnce({ Invoice: rawInvoice })
      .mockResolvedValueOnce({ Bill: rawBill })
      .mockResolvedValueOnce({ Payment: rawPayment })
      .mockResolvedValueOnce({ JournalEntry: rawJe })
    const singles = [
      await createInvoice(invoiceInput),
      await createBill(billInput),
      await createPayment(paymentInput),
      await createJournalEntry(jeInput),
    ]

    expect(answer.items.map((item) => (item.ok ? item.result : item.error))).toEqual(singles)
  })

  it('lets a whole-call failure throw, as the single tools do', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(new Error('rate limited'))
    await expect(
      batch({ items: [{ bId: 'c', operation: 'create', object: 'invoice', input: invoiceInput }] })
    ).rejects.toThrow('rate limited')
  })
})
