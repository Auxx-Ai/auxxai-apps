// src/tools/internal/purchase-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import purchaseGetManyExecute from './purchase-get-many.tool.server'

export const quickbooksPurchaseGetManyTool = defineTool({
  id: 'block_quickbooks_purchase_get_many',
  name: 'QuickBooks: get many purchases (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: purchaseGetManyExecute,
})
