// src/blocks/shopify/shopify-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS, RESOURCES } from './resources/constants'
import { orderInputs, orderComputeOutputs } from './resources/order/order-schema'
import { productInputs, productComputeOutputs } from './resources/product/product-schema'
import { customerInputs, customerComputeOutputs } from './resources/customer/customer-schema'
import {
  customerAddressInputs,
  customerAddressComputeOutputs,
} from './resources/customer-address/customer-address-schema'
import { variantInputs, variantComputeOutputs } from './resources/variant/variant-schema'
import {
  inventoryItemInputs,
  inventoryItemComputeOutputs,
} from './resources/inventory-item/inventory-item-schema'
import {
  inventoryLevelInputs,
  inventoryLevelComputeOutputs,
} from './resources/inventory-level/inventory-level-schema'
import { metafieldInputs, metafieldComputeOutputs } from './resources/metafield/metafield-schema'
import {
  fulfillmentInputs,
  fulfillmentComputeOutputs,
} from './resources/fulfillment/fulfillment-schema'
import {
  draftOrderInputs,
  draftOrderComputeOutputs,
} from './resources/draft-order/draft-order-schema'
import {
  collectionInputs,
  collectionComputeOutputs,
} from './resources/collection/collection-schema'
import { discountInputs, discountComputeOutputs } from './resources/discount/discount-schema'

export const shopifySchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [...RESOURCES],
      default: 'order',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'getMany',
    }),
    ...orderInputs,
    ...productInputs,
    ...customerInputs,
    ...customerAddressInputs,
    ...variantInputs,
    ...inventoryItemInputs,
    ...inventoryLevelInputs,
    ...metafieldInputs,
    ...fulfillmentInputs,
    ...draftOrderInputs,
    ...collectionInputs,
    ...discountInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'order') return orderComputeOutputs(operation)
    if (resource === 'product') return productComputeOutputs(operation)
    if (resource === 'customer') return customerComputeOutputs(operation)
    if (resource === 'customerAddress') return customerAddressComputeOutputs(operation)
    if (resource === 'variant') return variantComputeOutputs(operation)
    if (resource === 'inventoryItem') return inventoryItemComputeOutputs(operation)
    if (resource === 'inventoryLevel') return inventoryLevelComputeOutputs(operation)
    if (resource === 'metafield') return metafieldComputeOutputs(operation)
    if (resource === 'fulfillment') return fulfillmentComputeOutputs(operation)
    if (resource === 'draftOrder') return draftOrderComputeOutputs(operation)
    if (resource === 'collection') return collectionComputeOutputs(operation)
    if (resource === 'discount') return discountComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema
