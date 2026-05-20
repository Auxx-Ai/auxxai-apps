// src/tools/internal/estimate-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import estimateGetExecute from './estimate-get.tool.server'

export const quickbooksEstimateGetTool = defineTool({
  id: 'block_quickbooks_estimate_get',
  name: 'QuickBooks: get estimate (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: estimateGetExecute,
})
