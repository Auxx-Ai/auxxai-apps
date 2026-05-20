// src/tools/internal/draft-order-complete.tool.server.ts

import { executeDraftOrder } from '../../blocks/shopify/resources/draft-order/draft-order-execute.server'

export default async function draftOrderCompleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDraftOrder('complete', input)
}
