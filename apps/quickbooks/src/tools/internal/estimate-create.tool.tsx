// src/tools/internal/estimate-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import estimateCreateExecute from './estimate-create.tool.server'

export const quickbooksEstimateCreateTool = defineTool({
  id: 'block_quickbooks_estimate_create',
  name: 'QuickBooks: create estimate (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: estimateCreateExecute,
})
