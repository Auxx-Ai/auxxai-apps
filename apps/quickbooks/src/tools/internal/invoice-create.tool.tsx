// src/tools/internal/invoice-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import invoiceCreateExecute from './invoice-create.tool.server'

export const quickbooksInvoiceCreateTool = defineTool({
  id: 'block_quickbooks_invoice_create',
  name: 'QuickBooks: create invoice (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: invoiceCreateExecute,
})
