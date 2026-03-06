// src/blocks/shopify/resources/order/order-schema.ts

import { Workflow } from '@auxx/sdk'

export const orderInputs = {
  // --- Order: Create ---
  createLineItems: Workflow.array({
    label: 'Line Items',
    description: 'At least one line item is required',
    items: Workflow.struct({
      productId: Workflow.string({ label: 'Product ID', acceptsVariables: true }),
      variantId: Workflow.string({ label: 'Variant ID', acceptsVariables: true }),
      title: Workflow.string({ label: 'Title', acceptsVariables: true }),
      quantity: Workflow.string({ label: 'Quantity', default: '1', acceptsVariables: true }),
      price: Workflow.string({ label: 'Price', acceptsVariables: true }),
    }),
  }),
  createEmail: Workflow.string({
    label: 'Email',
    description: 'Customer email address',
    placeholder: 'customer@example.com',
    acceptsVariables: true,
  }),
  createFulfillmentStatus: Workflow.select({
    label: 'Fulfillment Status',
    options: [
      { value: '', label: 'Unfulfilled (default)' },
      { value: 'fulfilled', label: 'Fulfilled' },
      { value: 'partial', label: 'Partial' },
      { value: 'restocked', label: 'Restocked' },
    ],
    default: '',
  }),
  createNote: Workflow.string({
    label: 'Note',
    description: 'Optional note for the order',
    acceptsVariables: true,
  }),
  createTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated tags',
    placeholder: 'vip, rush',
    acceptsVariables: true,
  }),
  createSendReceipt: Workflow.select({
    label: 'Send Receipt',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  createSendFulfillmentReceipt: Workflow.select({
    label: 'Send Fulfillment Receipt',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  createInventoryBehaviour: Workflow.select({
    label: 'Inventory Behaviour',
    description: 'How inventory should be claimed',
    options: [
      { value: 'bypass', label: 'Bypass' },
      { value: 'decrement_ignoring_policy', label: 'Decrement (ignore policy)' },
      { value: 'decrement_obeying_policy', label: 'Decrement (obey policy)' },
    ],
    default: 'bypass',
  }),
  createLocationId: Workflow.select({
    label: 'Location',
    description: 'Location to fulfill from',
    options: [] as { value: string; label: string }[],
  }),
  createSourceName: Workflow.string({
    label: 'Source',
    description: 'Where the order originated',
    placeholder: 'web',
    acceptsVariables: true,
  }),
  createTest: Workflow.select({
    label: 'Test Order',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  // Shipping Address
  createShippingFirstName: Workflow.string({
    label: 'Shipping First Name',
    acceptsVariables: true,
  }),
  createShippingLastName: Workflow.string({ label: 'Shipping Last Name', acceptsVariables: true }),
  createShippingAddress1: Workflow.string({ label: 'Shipping Address 1', acceptsVariables: true }),
  createShippingAddress2: Workflow.string({ label: 'Shipping Address 2', acceptsVariables: true }),
  createShippingCity: Workflow.string({ label: 'Shipping City', acceptsVariables: true }),
  createShippingProvince: Workflow.string({
    label: 'Shipping Province/State',
    acceptsVariables: true,
  }),
  createShippingCountry: Workflow.string({ label: 'Shipping Country', acceptsVariables: true }),
  createShippingZip: Workflow.string({ label: 'Shipping Zip', acceptsVariables: true }),
  createShippingPhone: Workflow.string({ label: 'Shipping Phone', acceptsVariables: true }),
  // Billing Address
  createBillingFirstName: Workflow.string({ label: 'Billing First Name', acceptsVariables: true }),
  createBillingLastName: Workflow.string({ label: 'Billing Last Name', acceptsVariables: true }),
  createBillingAddress1: Workflow.string({ label: 'Billing Address 1', acceptsVariables: true }),
  createBillingAddress2: Workflow.string({ label: 'Billing Address 2', acceptsVariables: true }),
  createBillingCity: Workflow.string({ label: 'Billing City', acceptsVariables: true }),
  createBillingProvince: Workflow.string({
    label: 'Billing Province/State',
    acceptsVariables: true,
  }),
  createBillingCountry: Workflow.string({ label: 'Billing Country', acceptsVariables: true }),
  createBillingZip: Workflow.string({ label: 'Billing Zip', acceptsVariables: true }),
  createBillingPhone: Workflow.string({ label: 'Billing Phone', acceptsVariables: true }),
  // Discount Codes
  createDiscountCodes: Workflow.array({
    label: 'Discount Codes',
    items: Workflow.struct({
      code: Workflow.string({ label: 'Code', acceptsVariables: true }),
      amount: Workflow.string({ label: 'Amount', acceptsVariables: true }),
      type: Workflow.select({
        label: 'Type',
        options: [
          { value: 'fixed_amount', label: 'Fixed Amount' },
          { value: 'percentage', label: 'Percentage' },
          { value: 'shipping', label: 'Shipping' },
        ],
        default: 'fixed_amount',
      }),
    }),
  }),

  // --- Order: Delete ---
  deleteOrderId: Workflow.string({
    label: 'Order ID',
    description: 'ID of the order to delete',
    acceptsVariables: true,
  }),

  // --- Order: Get ---
  getOrderId: Workflow.string({
    label: 'Order ID',
    description: 'ID of the order to retrieve',
    acceptsVariables: true,
  }),
  getFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated list of fields to include (leave empty for all)',
    placeholder: 'id,name,total_price',
    acceptsVariables: true,
  }),

  // --- Order: Get Many ---
  getManyStatus: Workflow.select({
    label: 'Status',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    default: 'open',
  }),
  getManyFinancialStatus: Workflow.select({
    label: 'Financial Status',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'authorized', label: 'Authorized' },
      { value: 'paid', label: 'Paid' },
      { value: 'partially_paid', label: 'Partially Paid' },
      { value: 'partially_refunded', label: 'Partially Refunded' },
      { value: 'pending', label: 'Pending' },
      { value: 'refunded', label: 'Refunded' },
      { value: 'unpaid', label: 'Unpaid' },
      { value: 'voided', label: 'Voided' },
    ],
    default: 'any',
  }),
  getManyFulfillmentStatus: Workflow.select({
    label: 'Fulfillment Status',
    options: [
      { value: 'any', label: 'Any' },
      { value: 'partial', label: 'Partial' },
      { value: 'shipped', label: 'Shipped' },
      { value: 'unfulfilled', label: 'Unfulfilled' },
      { value: 'unshipped', label: 'Unshipped' },
    ],
    default: 'any',
  }),
  getManyLimit: Workflow.select({
    label: 'Limit',
    description: 'Maximum number of orders to return',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
    ],
    default: '50',
  }),
  getManyCreatedAtMin: Workflow.datetime({
    label: 'Created After',
    description: 'Show orders created after date (ISO 8601)',
    placeholder: '2026-01-01T00:00:00Z',
    acceptsVariables: true,
  }),
  getManyCreatedAtMax: Workflow.datetime({
    label: 'Created Before',
    description: 'Show orders created before date (ISO 8601)',
    placeholder: '2026-12-31T23:59:59Z',
    acceptsVariables: true,
  }),
  getManyUpdatedAtMin: Workflow.datetime({
    label: 'Updated After',
    description: 'Show orders updated after date (ISO 8601)',
    acceptsVariables: true,
  }),
  getManyUpdatedAtMax: Workflow.datetime({
    label: 'Updated Before',
    description: 'Show orders updated before date (ISO 8601)',
    acceptsVariables: true,
  }),
  getManyFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated list of fields to include',
    placeholder: 'id,name,total_price',
    acceptsVariables: true,
  }),

  // --- Order: Update ---
  updateOrderId: Workflow.string({
    label: 'Order ID',
    description: 'ID of the order to update',
    acceptsVariables: true,
  }),
  updateEmail: Workflow.string({
    label: 'Email',
    acceptsVariables: true,
  }),
  updateNote: Workflow.string({
    label: 'Note',
    acceptsVariables: true,
  }),
  updateTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated tags (replaces existing)',
    acceptsVariables: true,
  }),
  updateSourceName: Workflow.string({
    label: 'Source',
    acceptsVariables: true,
  }),
  updateLocationId: Workflow.select({
    label: 'Location',
    options: [] as { value: string; label: string }[],
  }),
  // Update Shipping Address
  updateShippingFirstName: Workflow.string({
    label: 'Shipping First Name',
    acceptsVariables: true,
  }),
  updateShippingLastName: Workflow.string({
    label: 'Shipping Last Name',
    acceptsVariables: true,
  }),
  updateShippingAddress1: Workflow.string({
    label: 'Shipping Address 1',
    acceptsVariables: true,
  }),
  updateShippingAddress2: Workflow.string({
    label: 'Shipping Address 2',
    acceptsVariables: true,
  }),
  updateShippingCity: Workflow.string({ label: 'Shipping City', acceptsVariables: true }),
  updateShippingProvince: Workflow.string({
    label: 'Shipping Province/State',
    acceptsVariables: true,
  }),
  updateShippingCountry: Workflow.string({ label: 'Shipping Country', acceptsVariables: true }),
  updateShippingZip: Workflow.string({ label: 'Shipping Zip', acceptsVariables: true }),
  updateShippingPhone: Workflow.string({ label: 'Shipping Phone', acceptsVariables: true }),
}

export function orderComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      orderId: Workflow.string({ label: 'Order ID' }),
      orderNumber: Workflow.string({ label: 'Order Number' }),
      name: Workflow.string({ label: 'Name' }),
      email: Workflow.string({ label: 'Email' }),
      totalPrice: Workflow.string({ label: 'Total Price' }),
      subtotalPrice: Workflow.string({ label: 'Subtotal Price' }),
      currency: Workflow.string({ label: 'Currency' }),
      financialStatus: Workflow.string({ label: 'Financial Status' }),
      fulfillmentStatus: Workflow.string({ label: 'Fulfillment Status' }),
      tags: Workflow.string({ label: 'Tags' }),
      note: Workflow.string({ label: 'Note' }),
      lineItems: Workflow.string({ label: 'Line Items (JSON)' }),
      customer: Workflow.string({ label: 'Customer (JSON)' }),
      createdAt: Workflow.string({ label: 'Created At' }),
      updatedAt: Workflow.string({ label: 'Updated At' }),
      orderStatusUrl: Workflow.string({ label: 'Status URL' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      orders: Workflow.string({ label: 'Orders (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
