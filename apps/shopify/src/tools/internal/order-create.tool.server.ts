// src/tools/internal/order-create.tool.server.ts

import { executeOrder } from '../../blocks/shopify/resources/order/order-execute.server'

export default async function orderCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeOrder('create', input)
}
