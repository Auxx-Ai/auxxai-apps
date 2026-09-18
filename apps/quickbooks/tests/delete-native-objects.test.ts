// apps/quickbooks/tests/delete-native-objects.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/blocks/quickbooks/shared/quickbooks-api', () => ({
  quickbooksApi: vi.fn(),
  quickbooksFault: (error: unknown) =>
    (error as { quickbooksFault?: unknown })?.quickbooksFault ?? null,
}))
vi.mock('../src/tools/shared/connection', () => ({
  getQuickbooksConnection: vi.fn(async () => ({
    credential: 'token',
    realmId: 'company-A',
    sandbox: true,
  })),
}))

import { quickbooksApi } from '../src/blocks/quickbooks/shared/quickbooks-api'
import deleteInvoice from '../src/tools/delete-quickbooks-invoice.tool.server'
import deleteSalesReceipt from '../src/tools/delete-quickbooks-sales-receipt.tool.server'

/** An error as `quickbooksApi` raises it: the parsed Intuit fault rides along. */
function faulted(message: string, code: string): Error {
  const error = new Error(message)
  Object.defineProperty(error, 'quickbooksFault', {
    value: { code, message, detail: message, element: null },
    enumerable: false,
  })
  return error
}

beforeEach(() => vi.clearAllMocks())

describe('delete_quickbooks_sales_receipt', () => {
  it('posts the delete operation with the id and sync token', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      SalesReceipt: { Id: '16', SyncToken: '1', domain: 'QBO' },
    })

    const result = await deleteSalesReceipt({ salesReceiptId: '16', syncToken: '1' })

    expect(quickbooksApi).toHaveBeenCalledWith(
      'company-A',
      '/salesreceipt?operation=delete',
      'token',
      expect.objectContaining({ method: 'POST', body: { Id: '16', SyncToken: '1' } })
    )
    expect(result).toEqual({ id: '16', status: 'Deleted', alreadyGone: false, domain: 'QBO' })
  })

  it('resolves rather than raising when the receipt is already gone (610)', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(faulted('Object Not Found', '610'))

    await expect(deleteSalesReceipt({ salesReceiptId: '16', syncToken: '1' })).resolves.toEqual({
      id: '16',
      status: 'NotFound',
      alreadyGone: true,
      domain: null,
    })
  })

  it('throws a stale-token refusal carrying Intuit text (5010)', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(
      faulted('Stale Object Error : You and someone else were working on this.', '5010')
    )

    await expect(deleteSalesReceipt({ salesReceiptId: '16', syncToken: '1' })).rejects.toThrow(
      /has changed since syncToken 1 was read\. Stale Object Error/
    )
  })
})

describe('delete_quickbooks_invoice', () => {
  it('posts the delete operation with the id and sync token', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      Invoice: { Id: '244', SyncToken: '2', domain: 'QBO' },
    })

    const result = await deleteInvoice({ invoiceId: '244', syncToken: '2' })

    expect(quickbooksApi).toHaveBeenCalledWith(
      'company-A',
      '/invoice?operation=delete',
      'token',
      expect.objectContaining({ method: 'POST', body: { Id: '244', SyncToken: '2' } })
    )
    expect(result).toEqual({ id: '244', status: 'Deleted', alreadyGone: false, domain: 'QBO' })
  })

  it('resolves rather than raising when the invoice is already gone (610)', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(faulted('Object Not Found', '610'))

    await expect(deleteInvoice({ invoiceId: '244', syncToken: '2' })).resolves.toEqual({
      id: '244',
      status: 'NotFound',
      alreadyGone: true,
      domain: null,
    })
  })

  it('throws a stale-token refusal carrying Intuit text (5010)', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(
      faulted('Stale Object Error : You and someone else were working on this.', '5010')
    )

    await expect(deleteInvoice({ invoiceId: '244', syncToken: '2' })).rejects.toThrow(
      /has changed since syncToken 2 was read\. Stale Object Error/
    )
  })

  it('refuses a missing or non-numeric sync token without HTTP', async () => {
    await expect(deleteInvoice({ invoiceId: '244', syncToken: '' })).rejects.toThrow(
      'syncToken is required'
    )
    await expect(deleteInvoice({ invoiceId: '244', syncToken: 'abc' })).rejects.toThrow(
      'syncToken must be a whole number'
    )
    expect(quickbooksApi).not.toHaveBeenCalled()
  })
})
