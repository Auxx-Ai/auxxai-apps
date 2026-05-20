// src/tools/internal/customer-address-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerAddressGetExecute from './customer-address-get.tool.server'

export const customerAddressGetTool = defineTool({
  id: 'block_shopify_customer_address_get',
  name: 'Shopify customerAddress get (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerAddressGetExecute,
})
