// src/tools/internal/bill-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import billDeleteExecute from './bill-delete.tool.server'

export const quickbooksBillDeleteTool = defineTool({
  id: 'block_quickbooks_bill_delete',
  name: 'QuickBooks: delete bill (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: billDeleteExecute,
})
