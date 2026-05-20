// src/tools/internal/charge-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import chargeGetExecute from './charge-get.tool.server'

export const chargeGetTool = defineTool({
  id: 'block_stripe_charge_get',
  name: 'Stripe: get charge (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: chargeGetExecute,
})
