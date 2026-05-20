// src/tools/update-quickbooks-payment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import updateQuickbooksPaymentExecute from './update-quickbooks-payment.tool.server'

export const updateQuickbooksPaymentTool = defineTool({
  id: 'update_quickbooks_payment',
  name: 'Update QuickBooks payment',
  description: 'Update non-line metadata on an existing payment. Sparse update.',
  icon: quickbooksIcon,
  inputs: z.object({
    paymentId: z.string(),
    txnDate: z.string().optional(),
    paymentRefNum: z.string().optional(),
    privateNote: z.string().optional(),
  }),
  outputs: z.object({
    paymentId: z.string(),
    totalAmt: z.number(),
    customerId: z.string(),
    syncToken: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: updateQuickbooksPaymentExecute,
  agent: { toolsetSlug: 'quickbooks.sales.write' },
})
