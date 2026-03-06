// src/blocks/shopify/shopify.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { executeOrder } from './resources/order/order-execute.server'
import { executeProduct } from './resources/product/product-execute.server'
import { executeCustomer } from './resources/customer/customer-execute.server'
import { executeCustomerAddress } from './resources/customer-address/customer-address-execute.server'
import { executeVariant } from './resources/variant/variant-execute.server'
import { executeInventoryItem } from './resources/inventory-item/inventory-item-execute.server'
import { executeInventoryLevel } from './resources/inventory-level/inventory-level-execute.server'
import { executeMetafield } from './resources/metafield/metafield-execute.server'
import { executeFulfillment } from './resources/fulfillment/fulfillment-execute.server'
import { executeDraftOrder } from './resources/draft-order/draft-order-execute.server'
import { executeCollection } from './resources/collection/collection-execute.server'
import { executeDiscount } from './resources/discount/discount-execute.server'

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
    case 'customer':
      return executeCustomer(operation, input)
    case 'customerAddress':
      return executeCustomerAddress(operation, input)
    case 'variant':
      return executeVariant(operation, input)
    case 'inventoryItem':
      return executeInventoryItem(operation, input)
    case 'inventoryLevel':
      return executeInventoryLevel(operation, input)
    case 'metafield':
      return executeMetafield(operation, input)
    case 'fulfillment':
      return executeFulfillment(operation, input)
    case 'draftOrder':
      return executeDraftOrder(operation, input)
    case 'collection':
      return executeCollection(operation, input)
    case 'discount':
      return executeDiscount(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
