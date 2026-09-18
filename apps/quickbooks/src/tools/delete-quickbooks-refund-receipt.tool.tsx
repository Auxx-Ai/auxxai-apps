// src/tools/delete-quickbooks-refund-receipt.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import deleteQuickbooksRefundReceiptExecute from './delete-quickbooks-refund-receipt.tool.server'

export const deleteQuickbooksRefundReceiptTool = defineTool({
  id: 'delete_quickbooks_refund_receipt',
  name: 'Delete QuickBooks refund receipt',
  description:
    'Remove a refund receipt from QuickBooks. Needs the current SyncToken; a stale one is refused rather than applied. Deleting a receipt that is already gone succeeds and reports alreadyGone.',
  icon: quickbooksIcon,
  inputs: z.object({
    refundReceiptId: z.string().min(1).describe('QuickBooks RefundReceipt.Id.'),
    syncToken: z.string().min(1).describe("The receipt's current SyncToken."),
  }),
  outputs: z.object({
    id: z.string(),
    status: z.enum(['Deleted', 'NotFound']),
    alreadyGone: z.boolean(),
    domain: z.string().nullable(),
  }),
  exampleOutput: {
    id: '52',
    status: 'Deleted',
    alreadyGone: false,
    domain: 'QBO',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteQuickbooksRefundReceiptExecute,
})
