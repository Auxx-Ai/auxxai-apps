// src/tools/internal/payment-void.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import paymentVoidExecute from './payment-void.tool.server'

export const quickbooksPaymentVoidTool = defineTool({
  id: 'block_quickbooks_payment_void',
  name: 'QuickBooks: void payment (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: paymentVoidExecute,
})
