// src/tools/internal/customer-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerGetManyExecute from './customer-get-many.tool.server'

export const customerGetManyTool = defineTool({
  id: 'block_shopify_customer_get_many',
  name: 'Shopify customer getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerGetManyExecute,
})
