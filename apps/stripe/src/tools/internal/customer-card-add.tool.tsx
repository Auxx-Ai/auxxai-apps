// src/tools/internal/customer-card-add.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import customerCardAddExecute from './customer-card-add.tool.server'

export const customerCardAddTool = defineTool({
  id: 'block_stripe_customer_card_add',
  name: 'Stripe: add customer card (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerCardAddExecute,
})
