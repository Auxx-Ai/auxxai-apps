// src/tools/internal/bill-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import billUpdateExecute from './bill-update.tool.server'

export const quickbooksBillUpdateTool = defineTool({
  id: 'block_quickbooks_bill_update',
  name: 'QuickBooks: update bill (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: billUpdateExecute,
})
