// src/tools/internal/bill-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import billCreateExecute from './bill-create.tool.server'

export const quickbooksBillCreateTool = defineTool({
  id: 'block_quickbooks_bill_create',
  name: 'QuickBooks: create bill (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: billCreateExecute,
})
