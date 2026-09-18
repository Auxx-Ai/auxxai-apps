// src/tools/delete-quickbooks-credit-memo.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import deleteQuickbooksCreditMemoExecute from './delete-quickbooks-credit-memo.tool.server'

export const deleteQuickbooksCreditMemoTool = defineTool({
  id: 'delete_quickbooks_credit_memo',
  name: 'Delete QuickBooks credit memo',
  description:
    'Remove a credit memo from QuickBooks. Needs the current SyncToken; a stale one is refused rather than applied. Deleting a memo that is already gone succeeds and reports alreadyGone.',
  icon: quickbooksIcon,
  inputs: z.object({
    creditMemoId: z.string().min(1).describe('QuickBooks CreditMemo.Id.'),
    syncToken: z.string().min(1).describe("The memo's current SyncToken."),
  }),
  outputs: z.object({
    id: z.string(),
    status: z.enum(['Deleted', 'NotFound']),
    alreadyGone: z.boolean(),
    domain: z.string().nullable(),
  }),
  exampleOutput: {
    id: '97',
    status: 'Deleted',
    alreadyGone: false,
    domain: 'QBO',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteQuickbooksCreditMemoExecute,
})
