// src/blocks/shopify/shopify.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { executeOrder } from './resources/order/order-execute.server'
import { executeProduct } from './resources/product/product-execute.server'

export default async function shopifyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'order':
      return executeOrder(operation, input)
    case 'product':
      return executeProduct(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
