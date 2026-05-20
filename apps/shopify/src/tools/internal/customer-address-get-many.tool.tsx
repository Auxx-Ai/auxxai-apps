// src/tools/internal/customer-address-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerAddressGetManyExecute from './customer-address-get-many.tool.server'

export const customerAddressGetManyTool = defineTool({
  id: 'block_shopify_customer_address_get_many',
  name: 'Shopify customerAddress getMany (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerAddressGetManyExecute,
})
