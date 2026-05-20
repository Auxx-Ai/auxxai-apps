// src/tools/internal/invoice-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import invoiceGetManyExecute from './invoice-get-many.tool.server'

export const quickbooksInvoiceGetManyTool = defineTool({
  id: 'block_quickbooks_invoice_get_many',
  name: 'QuickBooks: get many invoices (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: invoiceGetManyExecute,
})
