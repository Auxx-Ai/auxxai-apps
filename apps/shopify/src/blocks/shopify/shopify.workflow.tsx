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

const RESOURCE_LABELS: Record<string, Record<string, string>> = {
  order: {
    create: 'Create Order',
    delete: 'Delete Order',
    get: 'Get Order',
    getMany: 'Get Orders',
    update: 'Update Order',
  },
  product: {
    create: 'Create Product',
    delete: 'Delete Product',
    get: 'Get Product',
    getMany: 'Get Products',
    update: 'Update Product',
  },
  customer: {
    create: 'Create Customer',
    update: 'Update Customer',
    get: 'Get Customer',
    getMany: 'Get Customers',
    delete: 'Delete Customer',
    search: 'Search Customers',
  },
  customerAddress: {
    create: 'Create Address',
    update: 'Update Address',
    get: 'Get Address',
    getMany: 'Get Addresses',
    delete: 'Delete Address',
    setDefault: 'Set Default Address',
  },
  variant: {
    create: 'Create Variant',
    update: 'Update Variant',
    get: 'Get Variant',
    getMany: 'Get Variants',
    delete: 'Delete Variant',
  },
  inventoryItem: {
    get: 'Get Inventory Item',
    getMany: 'Get Inventory Items',
    update: 'Update Inventory Item',
  },
  inventoryLevel: {
    getMany: 'Get Inventory Levels',
    set: 'Set Inventory Level',
    adjust: 'Adjust Inventory Level',
    connect: 'Connect Inventory',
    delete: 'Delete Inventory Level',
  },
  metafield: {
    create: 'Create Metafield',
    update: 'Update Metafield',
    get: 'Get Metafield',
    getMany: 'Get Metafields',
    delete: 'Delete Metafield',
  },
  fulfillment: {
    create: 'Create Fulfillment',
    update: 'Update Tracking',
    get: 'Get Fulfillment',
    getMany: 'Get Fulfillments',
    cancel: 'Cancel Fulfillment',
  },
  draftOrder: {
    create: 'Create Draft Order',
    update: 'Update Draft Order',
    get: 'Get Draft Order',
    getMany: 'Get Draft Orders',
    delete: 'Delete Draft Order',
    complete: 'Complete Draft Order',
    sendInvoice: 'Send Invoice',
  },
  collection: {
    create: 'Create Collection',
    update: 'Update Collection',
    get: 'Get Collection',
    getMany: 'Get Collections',
    delete: 'Delete Collection',
    addProduct: 'Add to Collection',
    removeProduct: 'Remove from Collection',
  },
  discount: {
    create: 'Create Discount',
    update: 'Update Discount',
    get: 'Get Discount',
    getMany: 'Get Discounts',
    delete: 'Delete Discount',
  },
}

function ShopifyNode() {
  const { data } = useWorkflowNode()

  const resource = data.resource as string
  const operation = data.operation as string
  const label = RESOURCE_LABELS[resource]?.[operation] || 'Shopify'

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
  description: 'Manage your Shopify store — orders, products, customers, inventory, and more',
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
