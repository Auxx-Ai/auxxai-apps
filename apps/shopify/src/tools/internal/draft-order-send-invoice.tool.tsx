// src/tools/internal/draft-order-send-invoice.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shopifyIcon from '../../assets/icon.png'
import draftOrderSendInvoiceExecute from './draft-order-send-invoice.tool.server'

export const draftOrderSendInvoiceTool = defineTool({
  id: 'block_shopify_draft_order_send_invoice',
  name: 'Shopify draftOrder sendInvoice (block-internal)',
  description: 'Internal tool backing the Shopify workflow block. Not exposed to agents.',
  icon: shopifyIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: draftOrderSendInvoiceExecute,
})
