// src/blocks/shopify/resources/fulfillment/fulfillment-schema.ts

import { Workflow } from '@auxx/sdk'

export const fulfillmentInputs = {
  // Shared
  orderId: Workflow.string({ label: 'Order ID', acceptsVariables: true }),

  // --- Fulfillment: Create ---
  createLocationId: Workflow.select({
    label: 'Location',
    options: [] as { value: string; label: string }[],
  }),
  createTrackingNumber: Workflow.string({ label: 'Tracking Number', acceptsVariables: true }),
  createTrackingCompany: Workflow.string({
    label: 'Tracking Company',
    placeholder: 'UPS, FedEx, USPS, etc.',
    acceptsVariables: true,
  }),
  createTrackingUrl: Workflow.url({ label: 'Tracking URL', acceptsVariables: true }),
  createNotifyCustomer: Workflow.boolean({
    label: 'Notify Customer',
    default: false,
  }),
  createLineItems: Workflow.array({
    label: 'Line Items (optional, leave empty for all)',
    description: 'Specific line items to fulfill. Empty = fulfill all unfulfilled items.',
    items: Workflow.struct({
      id: Workflow.string({ label: 'Line Item ID', acceptsVariables: true }),
      quantity: Workflow.number({ label: 'Quantity', integer: true, acceptsVariables: true }),
    }),
  }),

  // --- Fulfillment: Update Tracking ---
  updateFulfillmentId: Workflow.string({ label: 'Fulfillment ID', acceptsVariables: true }),
  updateTrackingNumber: Workflow.string({ label: 'Tracking Number', acceptsVariables: true }),
  updateTrackingCompany: Workflow.string({ label: 'Tracking Company', acceptsVariables: true }),
  updateTrackingUrl: Workflow.url({ label: 'Tracking URL', acceptsVariables: true }),
  updateNotifyCustomer: Workflow.boolean({
    label: 'Notify Customer',
    default: false,
  }),

  // --- Fulfillment: Get ---
  getFulfillmentId: Workflow.string({ label: 'Fulfillment ID', acceptsVariables: true }),
  getFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields',
    acceptsVariables: true,
  }),

  // --- Fulfillment: Get Many ---
  getManyLimit: Workflow.select({
    label: 'Limit',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
    ],
    default: '50',
  }),
  getManyCreatedAtMin: Workflow.datetime({ label: 'Created After', acceptsVariables: true }),
  getManyCreatedAtMax: Workflow.datetime({ label: 'Created Before', acceptsVariables: true }),
  getManyFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields',
    acceptsVariables: true,
  }),

  // --- Fulfillment: Cancel ---
  cancelFulfillmentId: Workflow.string({ label: 'Fulfillment ID', acceptsVariables: true }),
}

const fulfillmentFields = {
  fulfillmentId: Workflow.string(),
  orderId: Workflow.string(),
  status: Workflow.string(),
  trackingNumber: Workflow.string(),
  trackingCompany: Workflow.string(),
  trackingUrl: Workflow.url(),
  lineItems: Workflow.string(),
  createdAt: Workflow.datetime(),
  updatedAt: Workflow.datetime(),
}

export function fulfillmentComputeOutputs(operation: string) {
  if (
    operation === 'create' ||
    operation === 'get' ||
    operation === 'update' ||
    operation === 'cancel'
  ) {
    return {
      fulfillment: Workflow.struct(fulfillmentFields, { label: 'fulfillment' }),
    }
  }
  if (operation === 'getMany') {
    return {
      fulfillments: Workflow.array({
        label: 'fulfillments',
        items: Workflow.struct(fulfillmentFields, { label: 'fulfillment' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  return {}
}
