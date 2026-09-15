// src/tools/list-shopify-payout-transactions.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import listShopifyPayoutTransactionsExecute from './list-shopify-payout-transactions.tool.server'

/**
 * Platform-called: the settlement job's Shopify Payments source itemises one payout through
 * this tool (accounting brief 27 §5). No `agent` key, so it is never offered to a chat
 * agent or rendered as an action.
 */
export const listShopifyPayoutTransactionsTool = defineTool({
  id: 'list_shopify_payout_transactions',
  name: 'List Shopify Payments payout transactions',
  description:
    'List every balance transaction inside one Shopify Payments payout, paged to exhaustion. Amounts are integer minor units; sourceOrderId matches the Shopify order id. Used by the platform settlement job; not meant for chat agents.',
  icon: shopifyIcon,
  inputs: z.object({
    payoutId: z.string().describe('Shopify payout id, as returned by list_shopify_payouts.'),
  }),
  outputs: z.object({
    transactions: z.array(
      z.object({
        id: z.string().describe('Balance transaction id.'),
        type: z
          .string()
          .describe('charge, refund, dispute, reserve, adjustment, credit, debit, payout, ...'),
        test: z.boolean(),
        amountMinor: z
          .number()
          .int()
          .describe('Gross, integer minor units. Negative for a refund.'),
        feeMinor: z.number().int(),
        netMinor: z.number().int(),
        sourceId: z.string().nullable(),
        sourceType: z.string().nullable(),
        sourceOrderId: z.string().nullable().describe('Shopify order id, when the row has one.'),
        sourceOrderTransactionId: z.string().nullable(),
        processedAt: z.string().describe('ISO 8601.'),
      }),
    ),
  }),
  exampleOutput: {
    transactions: [
      {
        id: '699519475',
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
      },
      {
        id: '699519476',
        type: 'refund',
        test: false,
        amountMinor: -2500,
        feeMinor: 0,
        netMinor: -2500,
        sourceId: '1006917262',
        sourceType: 'refund',
        sourceOrderId: '5498871002',
        sourceOrderTransactionId: '1006917262',
        processedAt: '2026-08-30T16:02:00-04:00',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: listShopifyPayoutTransactionsExecute,
})
