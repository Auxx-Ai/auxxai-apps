// src/tools/delete-quickbooks-bill.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import deleteQuickbooksBillExecute from './delete-quickbooks-bill.tool.server'

export const deleteQuickbooksBillTool = defineTool({
  id: 'delete_quickbooks_bill',
  name: 'Delete QuickBooks bill',
  description:
    'Remove a vendor bill from QuickBooks. Needs the current SyncToken; a stale one is refused rather than applied. Deleting a bill that is already gone succeeds and reports alreadyGone.',
  icon: quickbooksIcon,
  inputs: z.object({
    billId: z.string().min(1).describe('QuickBooks Bill.Id.'),
    syncToken: z.string().min(1).describe("The bill's current SyncToken."),
  }),
  outputs: z.object({
    id: z.string(),
    status: z.enum(['Deleted', 'NotFound']),
    alreadyGone: z.boolean(),
    domain: z.string().nullable(),
  }),
  exampleOutput: {
    id: '211',
    status: 'Deleted',
    alreadyGone: false,
    domain: 'QBO',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteQuickbooksBillExecute,
})
