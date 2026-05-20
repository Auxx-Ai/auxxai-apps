// src/tools/internal/customer-address-set-default.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerAddressSetDefaultExecute from './customer-address-set-default.tool.server'

export const customerAddressSetDefaultTool = defineTool({
  id: 'block_shopify_customer_address_set_default',
  name: 'Shopify customerAddress setDefault (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerAddressSetDefaultExecute,
})
