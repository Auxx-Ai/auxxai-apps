// src/tools/internal/order-delete.tool.server.ts

import { executeOrder } from '../../blocks/shopify/resources/order/order-execute.server'

export default async function orderDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeOrder('delete', input)
}
