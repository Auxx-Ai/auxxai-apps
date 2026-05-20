// src/tools/internal/draft-order-delete.tool.server.ts

import { executeDraftOrder } from '../../blocks/shopify/resources/draft-order/draft-order-execute.server'

export default async function draftOrderDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDraftOrder('delete', input)
}
