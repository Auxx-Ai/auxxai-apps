// src/tools/internal/fulfillment-get.tool.server.ts

import { executeFulfillment } from '../../blocks/shopify/resources/fulfillment/fulfillment-execute.server'

export default async function fulfillmentGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeFulfillment('get', input)
}
