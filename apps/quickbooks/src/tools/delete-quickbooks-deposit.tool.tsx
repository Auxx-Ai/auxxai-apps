// src/tools/delete-quickbooks-deposit.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import deleteQuickbooksDepositExecute from './delete-quickbooks-deposit.tool.server'

export const deleteQuickbooksDepositTool = defineTool({
  id: 'delete_quickbooks_deposit',
  name: 'Delete QuickBooks deposit',
  description:
    'Remove a deposit from QuickBooks. Needs the current SyncToken; a stale one is refused rather than applied. Deleting a deposit that is already gone succeeds and reports alreadyGone.',
  icon: quickbooksIcon,
  inputs: z.object({
    depositId: z.string().min(1).describe('QuickBooks Deposit.Id.'),
    syncToken: z.string().min(1).describe("The deposit's current SyncToken."),
  }),
  outputs: z.object({
    id: z.string(),
    status: z.enum(['Deleted', 'NotFound']),
    alreadyGone: z.boolean(),
    domain: z.string().nullable(),
  }),
  exampleOutput: {
    id: '73',
    status: 'Deleted',
    alreadyGone: false,
    domain: 'QBO',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteQuickbooksDepositExecute,
})
