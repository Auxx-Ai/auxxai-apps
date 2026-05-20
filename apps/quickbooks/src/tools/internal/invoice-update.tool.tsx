// src/tools/internal/invoice-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import invoiceUpdateExecute from './invoice-update.tool.server'

export const quickbooksInvoiceUpdateTool = defineTool({
  id: 'block_quickbooks_invoice_update',
  name: 'QuickBooks: update invoice (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: invoiceUpdateExecute,
})
