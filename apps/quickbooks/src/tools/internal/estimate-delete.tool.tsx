// src/tools/internal/estimate-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import estimateDeleteExecute from './estimate-delete.tool.server'

export const quickbooksEstimateDeleteTool = defineTool({
  id: 'block_quickbooks_estimate_delete',
  name: 'QuickBooks: delete estimate (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: estimateDeleteExecute,
})
