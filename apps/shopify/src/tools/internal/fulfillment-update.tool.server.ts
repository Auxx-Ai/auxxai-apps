// src/tools/internal/fulfillment-update.tool.server.ts

import { executeFulfillment } from '../../blocks/shopify/resources/fulfillment/fulfillment-execute.server'

export default async function fulfillmentUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeFulfillment('update', input)
}
