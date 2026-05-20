// src/tools/internal/customer-address-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerAddressCreateExecute from './customer-address-create.tool.server'

export const customerAddressCreateTool = defineTool({
  id: 'block_shopify_customer_address_create',
  name: 'Shopify customerAddress create (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerAddressCreateExecute,
})
