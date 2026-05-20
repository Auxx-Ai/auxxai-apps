// src/tools/internal/source-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import stripeIcon from '../../assets/icon.png'
import sourceDeleteExecute from './source-delete.tool.server'

export const sourceDeleteTool = defineTool({
  id: 'block_stripe_source_delete',
  name: 'Stripe: delete source (block-internal)',
  description: 'Internal tool backing the Stripe workflow block. Not exposed to agents.',
  icon: stripeIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: sourceDeleteExecute,
})
