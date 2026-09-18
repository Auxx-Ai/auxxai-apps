// src/tools/delete-quickbooks-sales-receipt.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import deleteQuickbooksSalesReceiptExecute from './delete-quickbooks-sales-receipt.tool.server'

export const deleteQuickbooksSalesReceiptTool = defineTool({
  id: 'delete_quickbooks_sales_receipt',
  name: 'Delete QuickBooks sales receipt',
  description:
    'Remove a sales receipt from QuickBooks. Needs the current SyncToken; a stale one is refused rather than applied. Deleting a receipt that is already gone succeeds and reports alreadyGone.',
  icon: quickbooksIcon,
  inputs: z.object({
    salesReceiptId: z.string().min(1).describe('QuickBooks SalesReceipt.Id.'),
    syncToken: z
      .string()
      .min(1)
      .describe("The receipt's current SyncToken. Read it back immediately before deleting."),
  }),
  outputs: z.object({
    id: z.string(),
    status: z.enum(['Deleted', 'NotFound']),
    alreadyGone: z.boolean(),
    domain: z.string().nullable(),
  }),
  exampleOutput: {
    id: '16',
    status: 'Deleted',
    alreadyGone: false,
    domain: 'QBO',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteQuickbooksSalesReceiptExecute,
})
