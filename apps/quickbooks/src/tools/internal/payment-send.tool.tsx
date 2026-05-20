// src/tools/internal/payment-send.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import paymentSendExecute from './payment-send.tool.server'

export const quickbooksPaymentSendTool = defineTool({
  id: 'block_quickbooks_payment_send',
  name: 'QuickBooks: send payment (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: paymentSendExecute,
})
