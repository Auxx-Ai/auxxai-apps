// src/tools/internal/draft-order-update.tool.server.ts

import { executeDraftOrder } from '../../blocks/shopify/resources/draft-order/draft-order-execute.server'

export default async function draftOrderUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDraftOrder('update', input)
}
