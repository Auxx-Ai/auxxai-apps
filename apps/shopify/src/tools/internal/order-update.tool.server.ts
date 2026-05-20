// src/tools/internal/order-update.tool.server.ts

import { executeOrder } from '../../blocks/shopify/resources/order/order-execute.server'

export default async function orderUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeOrder('update', input)
}
