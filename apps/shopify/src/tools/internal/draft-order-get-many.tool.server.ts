// src/tools/internal/draft-order-get-many.tool.server.ts

import { executeDraftOrder } from '../../blocks/shopify/resources/draft-order/draft-order-execute.server'

export default async function draftOrderGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDraftOrder('getMany', input)
}
