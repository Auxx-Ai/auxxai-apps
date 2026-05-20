// src/tools/internal/fulfillment-create.tool.server.ts

import { executeFulfillment } from '../../blocks/shopify/resources/fulfillment/fulfillment-execute.server'

export default async function fulfillmentCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeFulfillment('create', input)
}
