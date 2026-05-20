// src/tools/internal/source-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import sourceGetExecute from './source-get.tool.server'

export const sourceGetTool = defineTool({
  id: 'block_stripe_source_get',
  name: 'Stripe: get source (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: sourceGetExecute,
})
