// apps/quickbooks/tests/create-native-objects.test.ts
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
  invalidInput: (message: string) => {
    throw new Error(message)
  },
}))

import { quickbooksApi } from '../src/blocks/quickbooks/shared/quickbooks-api'
import createBill from '../src/tools/create-quickbooks-bill.tool.server'
import createDeposit from '../src/tools/create-quickbooks-deposit.tool.server'
import createRefundReceipt from '../src/tools/create-quickbooks-refund-receipt.tool.server'
import createSalesReceipt from '../src/tools/create-quickbooks-sales-receipt.tool.server'

beforeEach(() => vi.clearAllMocks())

describe('create_quickbooks_sales_receipt', () => {
  it('posts to /salesreceipt with minor-unit conversion, the tax line, DepositToAccountRef and requestId', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      SalesReceipt: { Id: '16', DocNumber: 'AUXX-1', TxnDate: '2026-09-15', TotalAmt: 53.98, SyncToken: '0' },
    })

    await createSalesReceipt({
      customerId: '58',
      lines: [
        { itemId: '1', amountMinor: 3499, description: 'Widget' },
        { itemId: '2', amountMinor: 1899, taxCode: 'NON' },
      ],
      depositToAccountId: '18',
      txnDate: '2026-09-15',
      docNumber: 'AUXX-1',
      requestId: 'sr-request',
    })

    expect(quickbooksApi).toHaveBeenCalledWith(
      'company-A',
      '/salesreceipt',
      'token',
      expect.objectContaining({
        method: 'POST',
        requestId: 'sr-request',
        body: expect.objectContaining({
          CustomerRef: { value: '58' },
          DepositToAccountRef: { value: '18' },
          TxnDate: '2026-09-15',
          DocNumber: 'AUXX-1',
          Line: [
            expect.objectContaining({
              Amount: 34.99,
              DetailType: 'SalesItemLineDetail',
              SalesItemLineDetail: { ItemRef: { value: '1' } },
            }),
            expect.objectContaining({
              Amount: 18.99,
              DetailType: 'SalesItemLineDetail',
              SalesItemLineDetail: { ItemRef: { value: '2' }, TaxCodeRef: { value: 'NON' } },
            }),
          ],
        }),
      })
    )
  })

  it('refuses a non-integer amountMinor without HTTP', async () => {
    await expect(
      createSalesReceipt({
        customerId: '58',
        lines: [{ itemId: '1', amountMinor: 34.5 }],
        depositToAccountId: '18',
      })
    ).rejects.toThrow('amountMinor')
    expect(quickbooksApi).not.toHaveBeenCalled()
  })
})

describe('create_quickbooks_refund_receipt', () => {
  it('sends paidFromAccountId as DepositToAccountRef (QuickBooks names it that on a refund too)', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      RefundReceipt: { Id: '52', DocNumber: 'AUXX-RR-1', TxnDate: '2026-09-15', TotalAmt: 18.99, SyncToken: '0' },
    })

    await createRefundReceipt({
      customerId: '58',
      lines: [{ itemId: '2', amountMinor: 1899 }],
      paidFromAccountId: '20',
      requestId: 'rr-request',
    })

    expect(quickbooksApi).toHaveBeenCalledWith(
      'company-A',
      '/refundreceipt',
      'token',
      expect.objectContaining({
        requestId: 'rr-request',
        body: expect.objectContaining({ DepositToAccountRef: { value: '20' } }),
      })
    )
  })
})

describe('create_quickbooks_deposit', () => {
  it('builds signed DepositLineDetail lines — a negative amount is a fee', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      Deposit: { Id: '73', TxnDate: '2026-09-15', TotalAmt: 96.5, SyncToken: '0' },
    })

    await createDeposit({
      depositToAccountId: '10',
      lines: [
        { accountId: '90', amountMinor: 10000 },
        { accountId: '91', amountMinor: -350, memo: 'processor fee' },
      ],
      requestId: 'dep-request',
    })

    expect(quickbooksApi).toHaveBeenCalledWith(
      'company-A',
      '/deposit',
      'token',
      expect.objectContaining({
        requestId: 'dep-request',
        body: expect.objectContaining({
          DepositToAccountRef: { value: '10' },
          Line: [
            expect.objectContaining({
              Amount: 100,
              DepositLineDetail: { AccountRef: { value: '90' } },
            }),
            expect.objectContaining({
              Amount: -3.5,
              Memo: 'processor fee',
              DepositLineDetail: { AccountRef: { value: '91' } },
            }),
          ],
        }),
      })
    )
  })
})

describe('create_quickbooks_bill', () => {
  it('builds AccountBasedExpenseLineDetail lines against VendorRef', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      Bill: { Id: '211', DocNumber: 'AUXX-BILL-1', TxnDate: '2026-09-15', TotalAmt: 500, Balance: 500, SyncToken: '0' },
    })

    await createBill({
      vendorId: '15',
      lines: [{ accountId: '60', amountMinor: 50000, description: 'Rent' }],
      dueDate: '2026-10-15',
      requestId: 'bill-request',
    })

    expect(quickbooksApi).toHaveBeenCalledWith(
      'company-A',
      '/bill',
      'token',
      expect.objectContaining({
        requestId: 'bill-request',
        body: expect.objectContaining({
          VendorRef: { value: '15' },
          DueDate: '2026-10-15',
          Line: [
            expect.objectContaining({
              Amount: 500,
              DetailType: 'AccountBasedExpenseLineDetail',
              AccountBasedExpenseLineDetail: { AccountRef: { value: '60' } },
            }),
          ],
        }),
      })
    )
  })
})
