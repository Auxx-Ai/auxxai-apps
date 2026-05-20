// src/tools/internal/item-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import itemGetExecute from './item-get.tool.server'

export const quickbooksItemGetTool = defineTool({
  id: 'block_quickbooks_item_get',
  name: 'QuickBooks: get item (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: itemGetExecute,
})
