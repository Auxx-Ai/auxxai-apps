// src/tools/internal/token-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import tokenCreateExecute from './token-create.tool.server'

export const tokenCreateTool = defineTool({
  id: 'block_stripe_token_create',
  name: 'Stripe: create token (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: tokenCreateExecute,
})
