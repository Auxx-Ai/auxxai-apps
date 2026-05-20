// src/tools/internal/charge-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import chargeUpdateExecute from './charge-update.tool.server'

export const chargeUpdateTool = defineTool({
  id: 'block_stripe_charge_update',
  name: 'Stripe: update charge (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: chargeUpdateExecute,
})
