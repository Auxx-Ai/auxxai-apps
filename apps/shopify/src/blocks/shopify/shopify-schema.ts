// src/blocks/shopify/shopify-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import { orderInputs, orderComputeOutputs } from './resources/order/order-schema'
import { productInputs, productComputeOutputs } from './resources/product/product-schema'

export const shopifySchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [
        { value: 'order', label: 'Order' },
        { value: 'product', label: 'Product' },
      ],
      default: 'order',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'getMany',
    }),
    ...orderInputs,
    ...productInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'order') return orderComputeOutputs(operation)
    if (resource === 'product') return productComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema
