// src/blocks/shopify/shopify.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import shopifyIcon from '../../assets/icon.png'
import shopifyExecute from './shopify.server'
import { ShopifyPanel } from './shopify-panel'
import { shopifySchema } from './shopify-schema'

export { shopifySchema }

function ShopifyNode() {
  const { data } = useWorkflowNode()

  let label = 'Shopify'

  if (data.resource === 'order') {
    if (data.operation === 'create') label = 'Create Order'
    else if (data.operation === 'delete') label = 'Delete Order'
    else if (data.operation === 'get') label = 'Get Order'
    else if (data.operation === 'getMany') label = 'Get Orders'
    else if (data.operation === 'update') label = 'Update Order'
  } else if (data.resource === 'product') {
    if (data.operation === 'create') label = 'Create Product'
    else if (data.operation === 'delete') label = 'Delete Product'
    else if (data.operation === 'get') label = 'Get Product'
    else if (data.operation === 'getMany') label = 'Get Products'
    else if (data.operation === 'update') label = 'Update Product'
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const shopifyBlock = {
  id: 'shopify',
  label: 'Shopify',
  description: 'Manage orders and products in your Shopify store',
  category: 'action',
  icon: shopifyIcon,
  color: '#96BF48',
  schema: shopifySchema,
  node: ShopifyNode,
  panel: ShopifyPanel,
  execute: shopifyExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof shopifySchema>
