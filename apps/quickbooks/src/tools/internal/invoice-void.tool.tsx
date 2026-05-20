// src/tools/internal/invoice-void.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import invoiceVoidExecute from './invoice-void.tool.server'

export const quickbooksInvoiceVoidTool = defineTool({
  id: 'block_quickbooks_invoice_void',
  name: 'QuickBooks: void invoice (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: invoiceVoidExecute,
})
