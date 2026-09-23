// apps/quickbooks/tests/bill-payment-and-purchase-reads.test.ts
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
import getBillPayment from '../src/tools/get-quickbooks-bill-payment.tool.server'
import getPurchase from '../src/tools/get-quickbooks-purchase.tool.server'
import { mapBillPayment } from '../src/tools/shared/map-bill-payment'
import { mapPurchase } from '../src/tools/shared/map-purchase'

function faulted(message: string, code: string): Error {
  const error = new Error(message)
  Object.defineProperty(error, 'quickbooksFault', {
    value: { code, message, detail: message, element: null },
    enumerable: false,
  })
  return error
}

beforeEach(() => vi.clearAllMocks())

describe('mapBillPayment', () => {
  it('reads a check payment, keeping each line and every linked type verbatim', () => {
    const mapped = mapBillPayment({
      Id: '104',
      SyncToken: '2',
      TxnDate: '2026-09-01',
      DocNumber: '1042',
      TotalAmt: 175,
      VendorRef: { value: '41', name: 'Norton Lumber' },
      PayType: 'Check',
      CheckPayment: { BankAccountRef: { value: '35', name: 'Checking' } },
      Line: [
        { Amount: 200, LinkedTxn: [{ TxnId: '96', TxnType: 'Bill' }] },
        { Amount: 25, LinkedTxn: [{ TxnId: '97', TxnType: 'VendorCredit' }] },
      ],
    })
    expect(mapped).toEqual({
      id: '104',
      syncToken: '2',
      txnDate: '2026-09-01',
      docNumber: '1042',
      totalAmt: 175,
      vendorId: '41',
      payType: 'Check',
      bankAccountId: '35',
      creditCardAccountId: null,
      linkedTxns: [
        { txnId: '96', txnType: 'Bill' },
        { txnId: '97', txnType: 'VendorCredit' },
      ],
      lines: [
        { amount: 200, linkedTxns: [{ txnId: '96', txnType: 'Bill' }] },
        { amount: 25, linkedTxns: [{ txnId: '97', txnType: 'VendorCredit' }] },
      ],
    })
  })

  it('reads the card account off a credit card payment', () => {
    const mapped = mapBillPayment({
      Id: '117',
      TotalAmt: 50.25,
      PayType: 'CreditCard',
      CreditCardPayment: { CCAccountRef: { value: '41' } },
      Line: [{ Amount: 50.25, LinkedTxn: [{ TxnId: '99', TxnType: 'Bill' }] }],
    })
    expect(mapped.bankAccountId).toBeNull()
    expect(mapped.creditCardAccountId).toBe('41')
    expect(mapped.docNumber).toBeNull()
    expect(mapped.totalAmt).toBe(50.25)
  })
})

describe('mapPurchase', () => {
  it('separates account lines from item lines and reads the payee type', () => {
    const mapped = mapPurchase({
      Id: '140',
      SyncToken: '0',
      TxnDate: '2026-09-02',
      TotalAmt: 142.5,
      PaymentType: 'CreditCard',
      AccountRef: { value: '41', name: 'Mastercard' },
      EntityRef: { value: '12', name: 'Hicks Hardware', type: 'Vendor' },
      Line: [
        {
          Amount: 42.5,
          DetailType: 'AccountBasedExpenseLineDetail',
          AccountBasedExpenseLineDetail: { AccountRef: { value: '7' } },
        },
        {
          Amount: 100,
          DetailType: 'ItemBasedExpenseLineDetail',
          ItemBasedExpenseLineDetail: { ItemRef: { value: '11' } },
          LinkedTxn: [{ TxnId: '8', TxnType: 'PurchaseOrder' }],
        },
      ],
    })
    expect(mapped).toEqual({
      id: '140',
      syncToken: '0',
      txnDate: '2026-09-02',
      docNumber: null,
      totalAmt: 142.5,
      paymentType: 'CreditCard',
      credit: false,
      accountId: '41',
      entityId: '12',
      entityType: 'Vendor',
      lines: [
        { amount: 42.5, accountId: '7', itemId: null, linkedTxns: [] },
        {
          amount: 100,
          accountId: null,
          itemId: '11',
          linkedTxns: [{ txnId: '8', txnType: 'PurchaseOrder' }],
        },
      ],
    })
  })

  it('flags a credit card credit and tolerates a purchase with no payee', () => {
    const mapped = mapPurchase({
      Id: '139',
      PaymentType: 'CreditCard',
      Credit: true,
      TotalAmt: 900,
      AccountRef: { value: '41' },
      Line: [],
    })
    expect(mapped.credit).toBe(true)
    expect(mapped.entityId).toBeNull()
    expect(mapped.entityType).toBeNull()
  })
})

describe('get_quickbooks_bill_payment', () => {
  it('reads /billpayment/{id}', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      BillPayment: { Id: '104', PayType: 'Check', TotalAmt: 10, Line: [] },
    })
    const result = await getBillPayment({ billPaymentId: '104' })
    expect(quickbooksApi).toHaveBeenCalledWith('company-A', '/billpayment/104', 'token', {
      sandbox: true,
    })
    expect(result).toMatchObject({ status: 'Found', id: '104', payType: 'Check' })
  })

  it('answers NotFound on a 610', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(faulted('Object Not Found', '610'))
    await expect(getBillPayment({ billPaymentId: '104' })).resolves.toEqual({
      status: 'NotFound',
    })
  })

  it('refuses an empty id without HTTP', async () => {
    await expect(getBillPayment({ billPaymentId: ' ' })).rejects.toThrow('billPaymentId')
    expect(quickbooksApi).not.toHaveBeenCalled()
  })
})

describe('get_quickbooks_purchase', () => {
  it('reads /purchase/{id}', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      Purchase: { Id: '140', PaymentType: 'Cash', TotalAmt: 10, Line: [] },
    })
    const result = await getPurchase({ purchaseId: '140' })
    expect(quickbooksApi).toHaveBeenCalledWith('company-A', '/purchase/140', 'token', {
      sandbox: true,
    })
    expect(result).toMatchObject({ status: 'Found', id: '140', paymentType: 'Cash' })
  })

  it('answers NotFound on a 610', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(faulted('Object Not Found', '610'))
    await expect(getPurchase({ purchaseId: '140' })).resolves.toEqual({ status: 'NotFound' })
  })

  it('rethrows any other fault', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(faulted('Throttled', '3001'))
    await expect(getPurchase({ purchaseId: '140' })).rejects.toThrow('Throttled')
  })
})
