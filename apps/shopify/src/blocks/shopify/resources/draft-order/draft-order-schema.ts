// src/blocks/shopify/resources/draft-order/draft-order-schema.ts

import { Workflow } from '@auxx/sdk'

export const draftOrderInputs = {
  // --- Draft Order: Create ---
  createLineItems: Workflow.array({
    label: 'Line Items',
    items: Workflow.struct({
      variantId: Workflow.string({ label: 'Variant ID', acceptsVariables: true }),
      title: Workflow.string({ label: 'Title (custom line item)', acceptsVariables: true }),
      quantity: Workflow.string({ label: 'Quantity', default: '1', acceptsVariables: true }),
      price: Workflow.string({ label: 'Price (custom line item)', acceptsVariables: true }),
    }),
  }),
  createCustomerId: Workflow.string({
    label: 'Customer ID',
    description: 'Existing customer to associate',
    acceptsVariables: true,
  }),
  createEmail: Workflow.string({
    label: 'Email',
    description: 'Required if no customer ID',
    acceptsVariables: true,
  }),
  createNote: Workflow.string({ label: 'Note', acceptsVariables: true }),
  createTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated',
    acceptsVariables: true,
  }),
  createTaxExempt: Workflow.select({
    label: 'Tax Exempt',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  createUseCustomerDefaultAddress: Workflow.select({
    label: 'Use Customer Default Address',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: 'true',
  }),
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

  // --- Draft Order: Update ---
  updateDraftOrderId: Workflow.string({ label: 'Draft Order ID', acceptsVariables: true }),
  updateNote: Workflow.string({ label: 'Note', acceptsVariables: true }),
  updateTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated (replaces existing)',
    acceptsVariables: true,
  }),
  updateEmail: Workflow.string({ label: 'Email', acceptsVariables: true }),

  // --- Draft Order: Get ---
  getDraftOrderId: Workflow.string({ label: 'Draft Order ID', acceptsVariables: true }),
  getFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields',
    acceptsVariables: true,
  }),

  // --- Draft Order: Get Many ---
  getManyStatus: Workflow.select({
    label: 'Status',
    options: [
      { value: '', label: 'Any' },
      { value: 'open', label: 'Open' },
      { value: 'invoice_sent', label: 'Invoice Sent' },
      { value: 'completed', label: 'Completed' },
    ],
    default: '',
  }),
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
  getManyFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields',
    acceptsVariables: true,
  }),

  // --- Draft Order: Delete ---
  deleteDraftOrderId: Workflow.string({ label: 'Draft Order ID', acceptsVariables: true }),

  // --- Draft Order: Complete ---
  completeDraftOrderId: Workflow.string({ label: 'Draft Order ID', acceptsVariables: true }),
  completePaymentPending: Workflow.select({
    label: 'Payment Pending',
    description: 'Mark as payment pending instead of paid',
    options: [
      { value: 'false', label: 'No (mark as paid)' },
      { value: 'true', label: 'Yes (payment pending)' },
    ],
    default: 'false',
  }),

  // --- Draft Order: Send Invoice ---
  sendInvoiceDraftOrderId: Workflow.string({ label: 'Draft Order ID', acceptsVariables: true }),
  sendInvoiceTo: Workflow.string({
    label: 'To Email',
    description: 'Recipient email (defaults to customer email)',
    acceptsVariables: true,
  }),
  sendInvoiceSubject: Workflow.string({ label: 'Subject', acceptsVariables: true }),
  sendInvoiceCustomMessage: Workflow.string({ label: 'Custom Message', acceptsVariables: true }),
  sendInvoiceBcc: Workflow.string({
    label: 'BCC',
    description: 'Comma-separated BCC emails',
    acceptsVariables: true,
  }),
}

export function draftOrderComputeOutputs(operation: string) {
  if (
    operation === 'create' ||
    operation === 'get' ||
    operation === 'update' ||
    operation === 'complete'
  ) {
    return {
      draftOrderId: Workflow.string({ label: 'Draft Order ID' }),
      name: Workflow.string({ label: 'Name' }),
      status: Workflow.string({ label: 'Status' }),
      email: Workflow.string({ label: 'Email' }),
      totalPrice: Workflow.string({ label: 'Total Price' }),
      subtotalPrice: Workflow.string({ label: 'Subtotal Price' }),
      currency: Workflow.string({ label: 'Currency' }),
      tags: Workflow.string({ label: 'Tags' }),
      note: Workflow.string({ label: 'Note' }),
      lineItems: Workflow.string({ label: 'Line Items (JSON)' }),
      customer: Workflow.string({ label: 'Customer (JSON)' }),
      orderId: Workflow.string({ label: 'Order ID (after completion)' }),
      invoiceUrl: Workflow.string({ label: 'Invoice URL' }),
      createdAt: Workflow.string({ label: 'Created At' }),
      updatedAt: Workflow.string({ label: 'Updated At' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      draftOrders: Workflow.string({ label: 'Draft Orders (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  if (operation === 'sendInvoice') {
    return {
      draftOrderInvoice: Workflow.string({ label: 'Invoice (JSON)' }),
    }
  }
  return {}
}
