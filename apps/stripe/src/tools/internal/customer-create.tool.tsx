// src/tools/internal/customer-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import customerCreateExecute from './customer-create.tool.server'

export const customerCreateTool = defineTool({
  id: 'block_stripe_customer_create',
  name: 'Stripe: create customer (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerCreateExecute,
})
