// src/tools/search-quickbooks-estimates.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import searchQuickbooksEstimatesExecute from './search-quickbooks-estimates.tool.server'

export const searchQuickbooksEstimatesTool = defineTool({
  id: 'search_quickbooks_estimates',
  name: 'Search QuickBooks estimates',
  description: 'Search QuickBooks estimates (quotes) by customer, status, and date range.',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z.string().optional().describe('Filter by Customer.Id.'),
    status: z.enum(['pending', 'accepted', 'closed', 'rejected', 'all']).default('all'),
    since: z.string().optional().describe('ISO date (YYYY-MM-DD).'),
    until: z.string().optional().describe('ISO date (YYYY-MM-DD).'),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  outputs: z.object({
    estimates: z.array(
      z.object({
        estimateId: z.string(),
        docNumber: z.string().nullable(),
        customerId: z.string(),
        customerName: z.string(),
        txnDate: z.string(),
        expirationDate: z.string().nullable(),
        totalAmt: z.number(),
        status: z.enum(['Pending', 'Accepted', 'Closed', 'Rejected']),
      })
    ),
    hasMore: z.boolean(),
  }),
  exampleOutput: {
    estimates: [
      {
        estimateId: '512',
        docNumber: 'EST-1021',
        customerId: '58',
        customerName: 'Acme Corp',
        txnDate: '2026-05-28',
        expirationDate: '2026-06-27',
        totalAmt: 4200,
        status: 'Pending',
      },
      {
        estimateId: '508',
        docNumber: 'EST-1017',
        customerId: '58',
        customerName: 'Acme Corp',
        txnDate: '2026-04-02',
        expirationDate: null,
        totalAmt: 1800,
        status: 'Accepted',
      },
    ],
    hasMore: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchQuickbooksEstimatesExecute,
  agent: { toolsetSlug: 'quickbooks.sales.read' },
})
