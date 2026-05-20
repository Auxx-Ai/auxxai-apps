// src/tools/internal/customer-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import customerGetExecute from './customer-get.tool.server'

export const customerGetTool = defineTool({
  id: 'block_stripe_customer_get',
  name: 'Stripe: get customer (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerGetExecute,
})
