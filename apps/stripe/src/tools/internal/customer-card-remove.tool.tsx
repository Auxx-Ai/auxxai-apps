// src/tools/internal/customer-card-remove.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import customerCardRemoveExecute from './customer-card-remove.tool.server'

export const customerCardRemoveTool = defineTool({
  id: 'block_stripe_customer_card_remove',
  name: 'Stripe: remove customer card (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: customerCardRemoveExecute,
})
