// src/tools/internal/customer-card-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import customerCardGetExecute from './customer-card-get.tool.server'

export const customerCardGetTool = defineTool({
  id: 'block_stripe_customer_card_get',
  name: 'Stripe: get customer card (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerCardGetExecute,
})
