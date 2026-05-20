// src/tools/internal/fulfillment-cancel.tool.server.ts

import { executeFulfillment } from '../../blocks/shopify/resources/fulfillment/fulfillment-execute.server'

export default async function fulfillmentCancelExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeFulfillment('cancel', input)
}
