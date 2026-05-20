// src/tools/internal/payment-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import paymentUpdateExecute from './payment-update.tool.server'

export const quickbooksPaymentUpdateTool = defineTool({
  id: 'block_quickbooks_payment_update',
  name: 'QuickBooks: update payment (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: paymentUpdateExecute,
})
