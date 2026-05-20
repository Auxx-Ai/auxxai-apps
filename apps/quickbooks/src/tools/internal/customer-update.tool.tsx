// src/tools/internal/customer-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import customerUpdateExecute from './customer-update.tool.server'

export const quickbooksCustomerUpdateTool = defineTool({
  id: 'block_quickbooks_customer_update',
  name: 'QuickBooks: update customer (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: customerUpdateExecute,
})
