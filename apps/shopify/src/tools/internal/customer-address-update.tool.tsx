// src/tools/internal/customer-address-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import customerAddressUpdateExecute from './customer-address-update.tool.server'

export const customerAddressUpdateTool = defineTool({
  id: 'block_shopify_customer_address_update',
  name: 'Shopify customerAddress update (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerAddressUpdateExecute,
})
