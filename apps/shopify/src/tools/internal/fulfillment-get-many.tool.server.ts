// src/tools/internal/fulfillment-get-many.tool.server.ts

import { executeFulfillment } from '../../blocks/shopify/resources/fulfillment/fulfillment-execute.server'

export default async function fulfillmentGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeFulfillment('getMany', input)
}
