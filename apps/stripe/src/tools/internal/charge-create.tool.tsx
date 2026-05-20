// src/tools/internal/charge-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import chargeCreateExecute from './charge-create.tool.server'

export const chargeCreateTool = defineTool({
  id: 'block_stripe_charge_create',
  name: 'Stripe: create charge (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: chargeCreateExecute,
})
