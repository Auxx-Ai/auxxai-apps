// src/tools/delete-quickbooks-invoice.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import deleteQuickbooksInvoiceExecute from './delete-quickbooks-invoice.tool.server'

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const deleteQuickbooksInvoiceTool = defineTool({
  id: 'delete_quickbooks_invoice',
  name: 'Delete QuickBooks invoice',
  description:
    'Remove an invoice from QuickBooks. Needs the current SyncToken; a stale one is refused rather than applied. Deleting an invoice that is already gone succeeds and reports alreadyGone.',
  icon: quickbooksIcon,
  inputs: z.object({
    invoiceId: z.string().min(1).describe('QuickBooks Invoice.Id.'),
    syncToken: z.string().min(1).describe("The invoice's current SyncToken."),
  }),
  outputs: z.object({
    id: z.string(),
    status: z.enum(['Deleted', 'NotFound']),
    alreadyGone: z.boolean(),
    domain: z.string().nullable(),
  }),
  exampleOutput: {
    id: '244',
    status: 'Deleted',
    alreadyGone: false,
    domain: 'QBO',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteQuickbooksInvoiceExecute,
})
