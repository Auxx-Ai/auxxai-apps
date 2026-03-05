// src/blocks/shopify/triggers/shopify-trigger/shopify-trigger.workflow.tsx

import type { WorkflowTrigger } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  useWorkflowNode,
} from '@auxx/sdk/client'
import shopifyIcon from '../../../../assets/icon.png'
import { ShopifyTriggerPanel } from './shopify-trigger-panel'
import { shopifyTriggerSchema } from './shopify-trigger-schema'
import shopifyTriggerExecute from './shopify-trigger.server'

const topicLabels: Record<string, string> = {
  'orders/create': 'Order Created',
  'orders/update': 'Order Updated',
  'orders/cancelled': 'Order Cancelled',
  'orders/fulfilled': 'Order Fulfilled',
  'orders/paid': 'Order Paid',
  'products/create': 'Product Created',
  'products/update': 'Product Updated',
  'products/delete': 'Product Deleted',
  'customers/create': 'Customer Created',
  'customers/update': 'Customer Updated',
  'refunds/create': 'Refund Created',
  'app/uninstalled': 'App Uninstalled',
}

function ShopifyTriggerNode() {
  const { data } = useWorkflowNode()
  const label = topicLabels[data.topic] || 'Shopify Trigger'

  return (
    <WorkflowNode>
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const shopifyTrigger = {
  id: 'shopify.shopify-trigger',
  label: 'Shopify Trigger',
  description: 'Triggers when Shopify events occur (orders, products, customers, etc.)',
  icon: shopifyIcon,
  color: '#96BF48',
  schema: shopifyTriggerSchema,
  node: ShopifyTriggerNode,
  panel: ShopifyTriggerPanel,
  execute: shopifyTriggerExecute,
  config: {
    timeout: 5000,
    retries: 0,
    requiresConnection: true,
  },
} satisfies WorkflowTrigger<typeof shopifyTriggerSchema>
