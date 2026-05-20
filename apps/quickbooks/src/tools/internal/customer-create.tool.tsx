// src/tools/internal/customer-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import customerCreateExecute from './customer-create.tool.server'

export const quickbooksCustomerCreateTool = defineTool({
  id: 'block_quickbooks_customer_create',
  name: 'QuickBooks: create customer (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: customerCreateExecute,
})
