// src/tools/create-quickbooks-estimate.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksEstimateExecute from './create-quickbooks-estimate.tool.server'

export const createQuickbooksEstimateTool = defineTool({
  id: 'create_quickbooks_estimate',
  name: 'Create QuickBooks estimate',
  description: 'Create a QuickBooks estimate (quote) for a customer.',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z.string().describe('QuickBooks Customer.Id.'),
    lines: z
      .array(
        z.object({
          itemId: z.string(),
          amount: z.number().positive(),
          quantity: z.number().positive().default(1),
          description: z.string().optional(),
        })
      )
      .min(1),
    docNumber: z.string().optional(),
    expirationDate: z.string().optional().describe('ISO date (YYYY-MM-DD).'),
    txnDate: z.string().optional(),
    billEmail: z.string().email().optional(),
    customerMemo: z.string().optional(),
  }),
  outputs: z.object({
    estimateId: z.string(),
    docNumber: z.string().nullable(),
    totalAmt: z.number(),
    syncToken: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksEstimateExecute,
})
