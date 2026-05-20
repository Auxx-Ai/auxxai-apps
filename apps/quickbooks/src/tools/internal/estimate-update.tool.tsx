// src/tools/internal/estimate-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import estimateUpdateExecute from './estimate-update.tool.server'

export const quickbooksEstimateUpdateTool = defineTool({
  id: 'block_quickbooks_estimate_update',
  name: 'QuickBooks: update estimate (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: estimateUpdateExecute,
})
