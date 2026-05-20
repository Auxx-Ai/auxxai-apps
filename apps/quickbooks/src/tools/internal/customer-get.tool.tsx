// src/tools/internal/customer-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import customerGetExecute from './customer-get.tool.server'

export const quickbooksCustomerGetTool = defineTool({
  id: 'block_quickbooks_customer_get',
  name: 'QuickBooks: get customer (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: customerGetExecute,
})
