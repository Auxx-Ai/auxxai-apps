// src/blocks/shopify/resources/draft-order/draft-order-schema.ts

import { Workflow } from '@auxx/sdk'

const draftOrderFieldOptions = [
  { value: 'id', label: 'ID' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'email', label: 'Email' },
  { value: 'total_price', label: 'Total Price' },
  { value: 'subtotal_price', label: 'Subtotal Price' },
  { value: 'currency', label: 'Currency' },
  { value: 'tags', label: 'Tags' },
  { value: 'note', label: 'Note' },
  { value: 'line_items', label: 'Line Items' },
  { value: 'customer', label: 'Customer' },
  { value: 'order_id', label: 'Order ID' },
  { value: 'invoice_url', label: 'Invoice URL' },
  { value: 'created_at', label: 'Created At' },
  { value: 'updated_at', label: 'Updated At' },
] as const

export const draftOrderInputs = {
  // --- Draft Order: Create ---
  createLineItems: Workflow.array({
    label: 'Line Items',
    required: true,
    items: Workflow.struct({
      variantId: Workflow.string({ label: 'Variant ID', acceptsVariables: true }),
      title: Workflow.string({ label: 'Title (custom line item)', acceptsVariables: true }),
      quantity: Workflow.number({ label: 'Quantity', integer: true, acceptsVariables: true }),
      price: Workflow.currency({ label: 'Price (custom line item)', acceptsVariables: true }),
    }),
  }),
  createCustomerId: Workflow.string({
    label: 'Customer ID',
    description: 'Existing customer to associate',
    acceptsVariables: true,
  }),
  createEmail: Workflow.email({
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
  createTaxExempt: Workflow.boolean({
    label: 'Tax Exempt',
    default: false,
  }),
  createUseCustomerDefaultAddress: Workflow.boolean({
    label: 'Use Customer Default Address',
    default: true,
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
  createShippingPhone: Workflow.phone({ label: 'Shipping Phone', acceptsVariables: true }),

  // --- Draft Order: Update ---
  updateDraftOrderId: Workflow.string({ label: 'Draft Order ID', required: true, acceptsVariables: true }),
  updateNote: Workflow.string({ label: 'Note', acceptsVariables: true }),
  updateTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated (replaces existing)',
    acceptsVariables: true,
  }),
  updateEmail: Workflow.email({ label: 'Email', acceptsVariables: true }),

  // --- Draft Order: Get ---
  getDraftOrderId: Workflow.string({ label: 'Draft Order ID', required: true, acceptsVariables: true }),
  getFields: Workflow.array({
    label: 'Fields',
    description: 'Fields to include in the response (leave empty for all)',
    items: Workflow.string({ label: 'Field' }),
    options: draftOrderFieldOptions,
    canAdd: true,
    canManage: false,
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
  getManyFields: Workflow.array({
    label: 'Fields',
    description: 'Fields to include in the response (leave empty for all)',
    items: Workflow.string({ label: 'Field' }),
    options: draftOrderFieldOptions,
    canAdd: true,
    canManage: false,
  }),

  // --- Draft Order: Delete ---
  deleteDraftOrderId: Workflow.string({ label: 'Draft Order ID', required: true, acceptsVariables: true }),

  // --- Draft Order: Complete ---
  completeDraftOrderId: Workflow.string({ label: 'Draft Order ID', required: true, acceptsVariables: true }),
  completePaymentPending: Workflow.boolean({
    label: 'Payment Pending',
    description: 'Mark as payment pending instead of paid',
    default: false,
  }),

  // --- Draft Order: Send Invoice ---
  sendInvoiceDraftOrderId: Workflow.string({ label: 'Draft Order ID', required: true, acceptsVariables: true }),
  sendInvoiceTo: Workflow.email({
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

const draftOrderFields = {
  draftOrderId: Workflow.string(),
  name: Workflow.string(),
  status: Workflow.string(),
  email: Workflow.email(),
  totalPrice: Workflow.currency(),
  subtotalPrice: Workflow.currency(),
  currency: Workflow.string(),
  tags: Workflow.string(),
  note: Workflow.string(),
  lineItems: Workflow.string(),
  customer: Workflow.string(),
  orderId: Workflow.string(),
  invoiceUrl: Workflow.url(),
  createdAt: Workflow.datetime(),
  updatedAt: Workflow.datetime(),
}

export function draftOrderComputeOutputs(operation: string) {
  if (
    operation === 'create' ||
    operation === 'get' ||
    operation === 'update' ||
    operation === 'complete'
  ) {
    return {
      draftOrder: Workflow.struct(draftOrderFields, { label: 'draftOrder' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.boolean({ label: 'success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      draftOrders: Workflow.array({
        label: 'draftOrders',
        items: Workflow.struct(draftOrderFields, { label: 'draftOrder' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  if (operation === 'sendInvoice') {
    return {
      draftOrderInvoice: Workflow.string(),
    }
  }
  return {}
}
