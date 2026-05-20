// src/tools/internal/estimate-send.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import estimateSendExecute from './estimate-send.tool.server'

export const quickbooksEstimateSendTool = defineTool({
  id: 'block_quickbooks_estimate_send',
  name: 'QuickBooks: send estimate (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: estimateSendExecute,
})
