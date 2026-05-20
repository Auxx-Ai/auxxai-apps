// src/tools/internal/purchase-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import purchaseGetExecute from './purchase-get.tool.server'

export const quickbooksPurchaseGetTool = defineTool({
  id: 'block_quickbooks_purchase_get',
  name: 'QuickBooks: get purchase (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: purchaseGetExecute,
})
