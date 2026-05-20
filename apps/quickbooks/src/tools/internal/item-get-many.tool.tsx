// src/tools/internal/item-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import itemGetManyExecute from './item-get-many.tool.server'

export const quickbooksItemGetManyTool = defineTool({
  id: 'block_quickbooks_item_get_many',
  name: 'QuickBooks: get many items (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: itemGetManyExecute,
})
