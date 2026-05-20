// src/tools/internal/balance-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import balanceGetExecute from './balance-get.tool.server'

export const balanceGetTool = defineTool({
  id: 'block_stripe_balance_get',
  name: 'Stripe: get balance (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: balanceGetExecute,
})
