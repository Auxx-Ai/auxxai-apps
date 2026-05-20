// src/tools/internal/invoice-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import invoiceGetExecute from './invoice-get.tool.server'

export const quickbooksInvoiceGetTool = defineTool({
  id: 'block_quickbooks_invoice_get',
  name: 'QuickBooks: get invoice (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: invoiceGetExecute,
})
