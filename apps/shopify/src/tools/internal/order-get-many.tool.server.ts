// src/tools/internal/order-get-many.tool.server.ts

import { executeOrder } from '../../blocks/shopify/resources/order/order-execute.server'

export default async function orderGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeOrder('getMany', input)
}
