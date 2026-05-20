// src/tools/internal/customer-address-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerAddressDeleteExecute from './customer-address-delete.tool.server'

export const customerAddressDeleteTool = defineTool({
  id: 'block_shopify_customer_address_delete',
  name: 'Shopify customerAddress delete (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerAddressDeleteExecute,
})
