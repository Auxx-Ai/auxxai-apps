// src/tools/get-quickbooks-purchase.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksPurchaseExecute from './get-quickbooks-purchase.tool.server'

export const getQuickbooksPurchaseTool = defineTool({
  id: 'get_quickbooks_purchase',
  name: 'Get QuickBooks purchase',
  description:
    'Fetch a QuickBooks purchase (an Expense, Check or Credit Card Expense/Credit) by id. Answers NotFound rather than throwing when it is gone.',
  icon: quickbooksIcon,
  inputs: z.object({
    purchaseId: z.string().describe('QuickBooks Purchase.Id.'),
  }),
  outputs: z.union([
    z.object({
      status: z.literal('Found'),
      id: z.string(),
      syncToken: z.string(),
      txnDate: z.string().nullable(),
      docNumber: z.string().nullable(),
      totalAmt: z.number(),
      paymentType: z.enum(['Cash', 'Check', 'CreditCard']),
      credit: z.boolean().describe('True on a Credit Card Credit (a refund to the card).'),
      accountId: z.string().nullable().describe('AccountRef — the bank or card paid from.'),
      entityId: z.string().nullable(),
      entityType: z.enum(['Vendor', 'Customer', 'Employee']).nullable(),
      lines: z.array(
        z.object({
          amount: z.number(),
          accountId: z
            .string()
            .nullable()
            .describe('AccountBasedExpenseLineDetail.AccountRef; null on an item line.'),
          itemId: z
            .string()
            .nullable()
            .describe('ItemBasedExpenseLineDetail.ItemRef; null on an account line.'),
          linkedTxns: z.array(z.object({ txnId: z.string(), txnType: z.string() })),
        })
      ),
    }),
    z.object({ status: z.literal('NotFound') }),
  ]),
  exampleOutput: {
    status: 'Found',
    id: '140',
    syncToken: '0',
    txnDate: '2026-08-18',
    docNumber: null,
    totalAmt: 42.5,
    paymentType: 'CreditCard',
    credit: false,
    accountId: '41',
    entityId: '12',
    entityType: 'Vendor',
    lines: [{ amount: 42.5, accountId: '7', itemId: null, linkedTxns: [] }],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksPurchaseExecute,
})
