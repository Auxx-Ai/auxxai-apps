// src/blocks/shopify/triggers/shopify-trigger/shopify-trigger-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const shopifyTriggerInputs = {
  topic: Workflow.select({
    label: 'Events',
    description: 'Shopify events to trigger on',
    multi: true,
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
      { value: 'customers/delete', label: 'Customer Deleted' },
      { value: 'fulfillments/create', label: 'Fulfillment Created' },
      { value: 'fulfillments/update', label: 'Fulfillment Updated' },
      { value: 'draft_orders/create', label: 'Draft Order Created' },
      { value: 'draft_orders/update', label: 'Draft Order Updated' },
      { value: 'draft_orders/delete', label: 'Draft Order Deleted' },
      { value: 'inventory_levels/connect', label: 'Inventory Level Connected' },
      { value: 'inventory_levels/update', label: 'Inventory Level Updated' },
      { value: 'inventory_levels/disconnect', label: 'Inventory Level Disconnected' },
      { value: 'collections/create', label: 'Collection Created' },
      { value: 'collections/update', label: 'Collection Updated' },
      { value: 'collections/delete', label: 'Collection Deleted' },
      { value: 'refunds/create', label: 'Refund Created' },
      { value: 'app/uninstalled', label: 'App Uninstalled' },
    ],
    default: ['orders/create'],
  }),
}

export const shopifyTriggerOutputs = {
  eventId: Workflow.string({ label: 'Event ID' }),
  topic: Workflow.string({ label: 'Topic' }),
  shopDomain: Workflow.string({ label: 'Shop Domain' }),
  payload: Workflow.string({ label: 'Payload (JSON)' }),
  resourceId: Workflow.string({ label: 'Resource ID' }),
  resourceName: Workflow.string({ label: 'Resource Name' }),
  email: Workflow.email({ label: 'Email' }),
  totalPrice: Workflow.currency({ label: 'Total Price' }),
  createdAt: Workflow.datetime({ label: 'Created At' }),
  updatedAt: Workflow.datetime({ label: 'Updated At' }),
}

export const shopifyTriggerSchema = {
  inputs: shopifyTriggerInputs,
  outputs: shopifyTriggerOutputs,
} satisfies WorkflowSchema
