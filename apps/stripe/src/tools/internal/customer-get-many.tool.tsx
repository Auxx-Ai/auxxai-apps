// src/tools/internal/customer-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import customerGetManyExecute from './customer-get-many.tool.server'

export const customerGetManyTool = defineTool({
  id: 'block_stripe_customer_get_many',
  name: 'Stripe: get many customers (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerGetManyExecute,
})
