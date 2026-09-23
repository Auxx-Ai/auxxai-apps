// src/tools/get-quickbooks-bill-payment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksBillPaymentExecute from './get-quickbooks-bill-payment.tool.server'

const linkedTxn = z.object({ txnId: z.string(), txnType: z.string() })

export const getQuickbooksBillPaymentTool = defineTool({
  id: 'get_quickbooks_bill_payment',
  name: 'Get QuickBooks bill payment',
  description:
    'Fetch a QuickBooks bill payment by id, with the bills and vendor credits it settles. Answers NotFound rather than throwing when it is gone.',
  icon: quickbooksIcon,
  inputs: z.object({
    billPaymentId: z.string().describe('QuickBooks BillPayment.Id.'),
  }),
  outputs: z.union([
    z.object({
      status: z.literal('Found'),
      id: z.string(),
      syncToken: z.string(),
      txnDate: z.string().nullable(),
      docNumber: z.string().nullable(),
      totalAmt: z.number(),
      vendorId: z.string().nullable(),
      payType: z.enum(['Check', 'CreditCard']),
      bankAccountId: z.string().nullable().describe('CheckPayment.BankAccountRef, on a check.'),
      creditCardAccountId: z
        .string()
        .nullable()
        .describe('CreditCardPayment.CCAccountRef, on a card payment.'),
      linkedTxns: z
        .array(linkedTxn)
        .describe("Every line's linked transactions, flattened, e.g. Bill or VendorCredit."),
      lines: z.array(z.object({ amount: z.number(), linkedTxns: z.array(linkedTxn) })),
    }),
    z.object({ status: z.literal('NotFound') }),
  ]),
  exampleOutput: {
    status: 'Found',
    id: '118',
    syncToken: '0',
    txnDate: '2026-08-18',
    docNumber: '1042',
    totalAmt: 250,
    vendorId: '41',
    payType: 'Check',
    bankAccountId: '35',
    creditCardAccountId: null,
    linkedTxns: [{ txnId: '96', txnType: 'Bill' }],
    lines: [{ amount: 250, linkedTxns: [{ txnId: '96', txnType: 'Bill' }] }],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksBillPaymentExecute,
})
