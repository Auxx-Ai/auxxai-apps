// src/tools/internal/customer-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import customerDeleteExecute from './customer-delete.tool.server'

export const customerDeleteTool = defineTool({
  id: 'block_stripe_customer_delete',
  name: 'Stripe: delete customer (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerDeleteExecute,
})
