// src/tools/internal/source-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import sourceCreateExecute from './source-create.tool.server'

export const sourceCreateTool = defineTool({
  id: 'block_stripe_source_create',
  name: 'Stripe: create source (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: sourceCreateExecute,
})
