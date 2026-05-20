// src/tools/internal/draft-order-get.tool.server.ts

import { executeDraftOrder } from '../../blocks/shopify/resources/draft-order/draft-order-execute.server'

export default async function draftOrderGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDraftOrder('get', input)
}
