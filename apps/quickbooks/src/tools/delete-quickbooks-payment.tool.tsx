// src/tools/delete-quickbooks-payment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import deleteQuickbooksPaymentExecute from './delete-quickbooks-payment.tool.server'

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const deleteQuickbooksPaymentTool = defineTool({
  id: 'delete_quickbooks_payment',
  name: 'Delete QuickBooks payment',
  description:
    'Remove a payment from QuickBooks. Needs the current SyncToken; a stale one is refused rather than applied. Deleting a payment that is already gone succeeds and reports alreadyGone.',
  icon: quickbooksIcon,
  inputs: z.object({
    paymentId: z.string().min(1).describe('QuickBooks Payment.Id.'),
    syncToken: z.string().min(1).describe("The payment's current SyncToken."),
  }),
  outputs: z.object({
    id: z.string(),
    status: z.enum(['Deleted', 'NotFound']),
    alreadyGone: z.boolean(),
    domain: z.string().nullable(),
  }),
  exampleOutput: {
    id: '332',
    status: 'Deleted',
    alreadyGone: false,
    domain: 'QBO',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteQuickbooksPaymentExecute,
})
