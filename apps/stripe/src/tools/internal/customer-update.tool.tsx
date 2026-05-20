// src/tools/internal/customer-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import customerUpdateExecute from './customer-update.tool.server'

export const customerUpdateTool = defineTool({
  id: 'block_stripe_customer_update',
  name: 'Stripe: update customer (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerUpdateExecute,
})
