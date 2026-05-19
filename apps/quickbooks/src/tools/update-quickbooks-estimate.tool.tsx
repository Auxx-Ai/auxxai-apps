// src/tools/update-quickbooks-estimate.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import updateQuickbooksEstimateExecute from './update-quickbooks-estimate.tool.server'

export const updateQuickbooksEstimateTool = defineTool({
  id: 'update_quickbooks_estimate',
  name: 'Update QuickBooks estimate',
  description:
    'Update fields on an existing estimate. NOTE: lines is full-replace — passing lines replaces the entire line array.',
  icon: quickbooksIcon,
  inputs: z.object({
    estimateId: z.string(),
    lines: z
      .array(
        z.object({
          itemId: z.string(),
          amount: z.number().positive(),
          quantity: z.number().positive().default(1),
          description: z.string().optional(),
        })
      )
      .min(1)
      .optional(),
    docNumber: z.string().optional(),
    expirationDate: z.string().optional(),
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
  execute: updateQuickbooksEstimateExecute,
})
