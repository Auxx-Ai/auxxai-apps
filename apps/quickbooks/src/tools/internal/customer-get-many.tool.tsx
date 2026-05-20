// src/tools/internal/customer-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import customerGetManyExecute from './customer-get-many.tool.server'

export const quickbooksCustomerGetManyTool = defineTool({
  id: 'block_quickbooks_customer_get_many',
  name: 'QuickBooks: get many customers (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: customerGetManyExecute,
})
