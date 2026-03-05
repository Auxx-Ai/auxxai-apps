// src/blocks/shopify/triggers/shopify-trigger/shopify-trigger-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const shopifyTriggerInputs = {
  topic: Workflow.select({
    label: 'Event',
    description: 'Shopify event to trigger on',
    options: [
      { value: 'orders/create', label: 'Order Created' },
      { value: 'orders/update', label: 'Order Updated' },
      { value: 'orders/cancelled', label: 'Order Cancelled' },
      { value: 'orders/fulfilled', label: 'Order Fulfilled' },
      { value: 'orders/paid', label: 'Order Paid' },
      { value: 'products/create', label: 'Product Created' },
      { value: 'products/update', label: 'Product Updated' },
      { value: 'products/delete', label: 'Product Deleted' },
      { value: 'customers/create', label: 'Customer Created' },
      { value: 'customers/update', label: 'Customer Updated' },
      { value: 'refunds/create', label: 'Refund Created' },
      { value: 'app/uninstalled', label: 'App Uninstalled' },
    ],
    default: 'orders/create',
  }),
}

export const shopifyTriggerOutputs = {
  eventId: Workflow.string({ label: 'Event ID' }),
  topic: Workflow.string({ label: 'Topic' }),
  shopDomain: Workflow.string({ label: 'Shop Domain' }),
  payload: Workflow.string({ label: 'Payload (JSON)' }),
  resourceId: Workflow.string({ label: 'Resource ID' }),
  resourceName: Workflow.string({ label: 'Resource Name' }),
  email: Workflow.string({ label: 'Email' }),
  totalPrice: Workflow.string({ label: 'Total Price' }),
  createdAt: Workflow.string({ label: 'Created At' }),
  updatedAt: Workflow.string({ label: 'Updated At' }),
}

export const shopifyTriggerSchema = {
  inputs: shopifyTriggerInputs,
  outputs: shopifyTriggerOutputs,
} satisfies WorkflowSchema
