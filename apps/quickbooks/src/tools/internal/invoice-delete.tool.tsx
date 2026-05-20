// src/tools/internal/invoice-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import invoiceDeleteExecute from './invoice-delete.tool.server'

export const quickbooksInvoiceDeleteTool = defineTool({
  id: 'block_quickbooks_invoice_delete',
  name: 'QuickBooks: delete invoice (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: invoiceDeleteExecute,
})
