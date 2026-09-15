// src/tools/list-shopify-payouts.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../assets/icon.png'
import listShopifyPayoutsExecute from './list-shopify-payouts.tool.server'

const payoutStatus = z.enum(['scheduled', 'in_transit', 'paid', 'failed', 'canceled'])

/**
 * Platform-called: the settlement job's Shopify Payments source reads payouts through this
 * tool (accounting brief 27 §5). No `agent` key, like `get_quickbooks_general_ledger`, so it
 * is never offered to a chat agent or rendered as an action.
 */
export const listShopifyPayoutsTool = defineTool({
  id: 'list_shopify_payouts',
  name: 'List Shopify Payments payouts',
  description:
    'List Shopify Payments payouts dated on or after a day, oldest first, paged to exhaustion. Amounts are integer minor units transcribed from the payout, never summed. Used by the platform settlement job; not meant for chat agents.',
  icon: shopifyIcon,
  inputs: z.object({
    since: z.string().describe('YYYY-MM-DD, inclusive. Maps to date_min.'),
    until: z.string().optional().describe('YYYY-MM-DD, inclusive. Maps to date_max.'),
    status: payoutStatus.optional().describe('Restrict to one payout status.'),
  }),
  outputs: z.object({
    payouts: z.array(
      z.object({
        id: z.string().describe('Shopify payout id.'),
        status: payoutStatus,
        date: z.string().describe('YYYY-MM-DD the payout was, or is to be, deposited.'),
        currency: z.string().describe('ISO 4217.'),
        amountMinor: z.number().int().describe('The deposit, integer minor units.'),
        summary: z.object({
          adjustmentsFeeMinor: z.number().int(),
          adjustmentsGrossMinor: z.number().int(),
          chargesFeeMinor: z.number().int(),
          chargesGrossMinor: z.number().int(),
          refundsFeeMinor: z.number().int(),
          refundsGrossMinor: z.number().int(),
          reservedFundsFeeMinor: z.number().int(),
          reservedFundsGrossMinor: z.number().int(),
          retriedPayoutsFeeMinor: z.number().int(),
          retriedPayoutsGrossMinor: z.number().int(),
        }),
      }),
    ),
  }),
  exampleOutput: {
    payouts: [
      {
        id: '623721858',
        status: 'paid',
        date: '2026-09-01',
        currency: 'USD',
        amountMinor: 412355,
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
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: listShopifyPayoutsExecute,
})
