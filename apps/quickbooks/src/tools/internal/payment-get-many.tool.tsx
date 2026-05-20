// src/tools/internal/payment-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import paymentGetManyExecute from './payment-get-many.tool.server'

export const quickbooksPaymentGetManyTool = defineTool({
  id: 'block_quickbooks_payment_get_many',
  name: 'QuickBooks: get many payments (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: paymentGetManyExecute,
})
