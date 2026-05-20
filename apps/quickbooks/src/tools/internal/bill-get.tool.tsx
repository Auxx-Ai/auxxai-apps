// src/tools/internal/bill-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import billGetExecute from './bill-get.tool.server'

export const quickbooksBillGetTool = defineTool({
  id: 'block_quickbooks_bill_get',
  name: 'QuickBooks: get bill (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: billGetExecute,
})
