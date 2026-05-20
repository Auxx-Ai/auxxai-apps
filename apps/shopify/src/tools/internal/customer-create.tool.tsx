// src/tools/internal/customer-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerCreateExecute from './customer-create.tool.server'

export const customerCreateTool = defineTool({
  id: 'block_shopify_customer_create',
  name: 'Shopify customer create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerCreateExecute,
})
