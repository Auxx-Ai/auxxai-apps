// src/tools/internal/draft-order-create.tool.server.ts

import { executeDraftOrder } from '../../blocks/shopify/resources/draft-order/draft-order-execute.server'

export default async function draftOrderCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeDraftOrder('create', input)
}
