// src/tools/internal/draft-order-send-invoice.tool.server.ts

import { executeDraftOrder } from '../../blocks/shopify/resources/draft-order/draft-order-execute.server'

export default async function draftOrderSendInvoiceExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDraftOrder('sendInvoice', input)
}
