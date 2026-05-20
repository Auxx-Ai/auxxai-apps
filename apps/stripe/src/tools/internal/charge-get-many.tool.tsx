// src/tools/internal/charge-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import chargeGetManyExecute from './charge-get-many.tool.server'

export const chargeGetManyTool = defineTool({
  id: 'block_stripe_charge_get_many',
  name: 'Stripe: get many charges (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: chargeGetManyExecute,
})
