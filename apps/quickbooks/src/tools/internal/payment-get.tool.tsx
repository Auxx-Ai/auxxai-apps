// src/tools/internal/payment-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import paymentGetExecute from './payment-get.tool.server'

export const quickbooksPaymentGetTool = defineTool({
  id: 'block_quickbooks_payment_get',
  name: 'QuickBooks: get payment (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: paymentGetExecute,
})
