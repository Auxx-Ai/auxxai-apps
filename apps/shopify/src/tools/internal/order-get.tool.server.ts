// src/tools/internal/order-get.tool.server.ts

import { executeOrder } from '../../blocks/shopify/resources/order/order-execute.server'

export default async function orderGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeOrder('get', input)
}
