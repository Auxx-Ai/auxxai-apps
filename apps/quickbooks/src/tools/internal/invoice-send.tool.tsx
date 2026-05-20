// src/tools/internal/invoice-send.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import invoiceSendExecute from './invoice-send.tool.server'

export const quickbooksInvoiceSendTool = defineTool({
  id: 'block_quickbooks_invoice_send',
  name: 'QuickBooks: send invoice (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: invoiceSendExecute,
})
