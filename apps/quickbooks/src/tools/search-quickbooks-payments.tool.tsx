// src/tools/search-quickbooks-payments.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import searchQuickbooksPaymentsExecute from './search-quickbooks-payments.tool.server'

export const searchQuickbooksPaymentsTool = defineTool({
  id: 'search_quickbooks_payments',
  name: 'Search QuickBooks payments',
  description: 'Search QuickBooks payments by customer and date range.',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z.string().optional().describe('Filter by Customer.Id.'),
    since: z.string().optional().describe('ISO date (YYYY-MM-DD).'),
    until: z.string().optional().describe('ISO date (YYYY-MM-DD).'),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  outputs: z.object({
    payments: z.array(
      z.object({
        paymentId: z.string(),
        customerId: z.string(),
        customerName: z.string(),
        txnDate: z.string(),
        totalAmt: z.number(),
        unappliedAmt: z.number(),
      })
    ),
    hasMore: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchQuickbooksPaymentsExecute,
  agent: { toolsetSlug: 'quickbooks.sales.read' },
})
