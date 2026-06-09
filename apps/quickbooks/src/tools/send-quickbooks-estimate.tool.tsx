// src/tools/send-quickbooks-estimate.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import sendQuickbooksEstimateExecute from './send-quickbooks-estimate.tool.server'

export const sendQuickbooksEstimateTool = defineTool({
  id: 'send_quickbooks_estimate',
  name: 'Send QuickBooks estimate',
  description: 'Email a QuickBooks estimate to the customer. Side-effect: actually sends an email.',
  icon: quickbooksIcon,
  inputs: z.object({
    estimateId: z.string().describe('QuickBooks Estimate.Id to send.'),
    email: z.string().email().optional().describe('Override the estimate BillEmail.'),
  }),
  outputs: z.object({
    estimateId: z.string(),
    emailStatus: z.enum(['EmailSent']),
  }),
  exampleOutput: {
    estimateId: '512',
    emailStatus: 'EmailSent',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: sendQuickbooksEstimateExecute,
  agent: { toolsetSlug: 'quickbooks.sales.write' },
})
