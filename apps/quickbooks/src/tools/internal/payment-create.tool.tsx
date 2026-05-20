// src/tools/internal/payment-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import paymentCreateExecute from './payment-create.tool.server'

export const quickbooksPaymentCreateTool = defineTool({
  id: 'block_quickbooks_payment_create',
  name: 'QuickBooks: create payment (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: paymentCreateExecute,
})
