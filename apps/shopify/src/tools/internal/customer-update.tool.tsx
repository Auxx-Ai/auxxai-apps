// src/tools/internal/customer-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerUpdateExecute from './customer-update.tool.server'

export const customerUpdateTool = defineTool({
  id: 'block_shopify_customer_update',
  name: 'Shopify customer update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerUpdateExecute,
})
