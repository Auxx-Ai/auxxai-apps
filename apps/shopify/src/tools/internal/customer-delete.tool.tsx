// src/tools/internal/customer-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerDeleteExecute from './customer-delete.tool.server'

export const customerDeleteTool = defineTool({
  id: 'block_shopify_customer_delete',
  name: 'Shopify customer delete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerDeleteExecute,
})
