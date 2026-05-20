// src/tools/internal/payment-delete.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import paymentDeleteExecute from './payment-delete.tool.server'

export const quickbooksPaymentDeleteTool = defineTool({
  id: 'block_quickbooks_payment_delete',
  name: 'QuickBooks: delete payment (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: paymentDeleteExecute,
})
