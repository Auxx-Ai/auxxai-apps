// src/tools/get-quickbooks-estimate.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksEstimateExecute from './get-quickbooks-estimate.tool.server'

export const getQuickbooksEstimateTool = defineTool({
  id: 'get_quickbooks_estimate',
  name: 'Get QuickBooks estimate',
  description:
    'Fetch a QuickBooks estimate (quote) by id. Returns line items, status, and customer refs.',
  icon: quickbooksIcon,
  inputs: z.object({
    estimateId: z.string().describe('QuickBooks Estimate.Id.'),
  }),
  outputs: z.object({
    estimateId: z.string(),
    docNumber: z.string().nullable(),
    customerId: z.string(),
    customerName: z.string(),
    txnDate: z.string(),
    expirationDate: z.string().nullable(),
    totalAmt: z.number(),
    status: z.enum(['Pending', 'Accepted', 'Closed', 'Rejected']),
    emailStatus: z.enum(['NotSet', 'NeedToSend', 'EmailSent']),
    billEmail: z.string().nullable(),
    customerMemo: z.string().nullable(),
    lines: z.array(
      z.object({
        itemId: z.string().nullable(),
        description: z.string().nullable(),
        amount: z.number(),
        quantity: z.number().nullable(),
      })
    ),
    syncToken: z.string(),
    auxxContactId: refs.entity('contact').nullable(),
    auxxCompanyId: refs.entity('company').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksEstimateExecute,
  agent: { toolsetSlug: 'quickbooks.sales.read' },
})
