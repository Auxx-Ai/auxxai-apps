// src/tools/internal/estimate-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import estimateGetManyExecute from './estimate-get-many.tool.server'

export const quickbooksEstimateGetManyTool = defineTool({
  id: 'block_quickbooks_estimate_get_many',
  name: 'QuickBooks: get many estimates (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: estimateGetManyExecute,
})
