import { Workflow } from '@auxx/sdk'

export const invoiceInputs = {
  // --- Invoice: Create ---
  createInvoiceCustomer: Workflow.select({
    label: 'Customer',
    description: 'Select a customer for this invoice',
    options: [],
  }),
  createInvoiceItemId: Workflow.select({
    label: 'Item',
    description: 'Line item product/service',
    options: [] as { value: string; label: string }[],
  }),
  createInvoiceAmount: Workflow.string({
    label: 'Amount',
    description: 'Line item amount',
    acceptsVariables: true,
  }),
  createInvoiceDescription: Workflow.string({
    label: 'Description',
    description: 'Line item description',
    acceptsVariables: true,
  }),
  createInvoiceQuantity: Workflow.string({
    label: 'Quantity',
    description: 'Line item quantity',
    acceptsVariables: true,
  }),
  createInvoiceDocNumber: Workflow.string({
    label: 'Invoice Number',
    description: 'Custom invoice number',
    acceptsVariables: true,
  }),
  createInvoiceDueDate: Workflow.string({
    label: 'Due Date',
    description: 'YYYY-MM-DD',
    placeholder: '2025-12-31',
    acceptsVariables: true,
  }),
  createInvoiceTxnDate: Workflow.string({
    label: 'Transaction Date',
    description: 'YYYY-MM-DD',
    placeholder: '2025-01-01',
    acceptsVariables: true,
  }),
  createInvoiceBillEmail: Workflow.string({
    label: 'Bill To Email',
    placeholder: 'customer@example.com',
    acceptsVariables: true,
  }),
  createInvoiceCustomerMemo: Workflow.string({
    label: 'Customer Memo',
    acceptsVariables: true,
  }),
  createInvoiceBillAddrLine1: Workflow.string({
    label: 'Billing Address Line 1',
    acceptsVariables: true,
  }),
  createInvoiceBillAddrCity: Workflow.string({
    label: 'Billing City',
    acceptsVariables: true,
  }),
  createInvoiceBillAddrPostalCode: Workflow.string({
    label: 'Billing Postal Code',
    acceptsVariables: true,
  }),
  createInvoiceBillAddrState: Workflow.string({
    label: 'Billing State',
    acceptsVariables: true,
  }),

  // --- Invoice: Delete ---
  deleteInvoiceId: Workflow.string({
    label: 'Invoice ID',
    acceptsVariables: true,
  }),

  // --- Invoice: Get ---
  getInvoiceId: Workflow.string({
    label: 'Invoice ID',
    acceptsVariables: true,
  }),

  // --- Invoice: Get Many ---
  getManyInvoiceReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyInvoiceLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyInvoiceQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. TotalAmt > '100.00'",
    acceptsVariables: true,
  }),

  // --- Invoice: Send ---
  sendInvoiceId: Workflow.string({
    label: 'Invoice ID',
    acceptsVariables: true,
  }),
  sendInvoiceEmail: Workflow.string({
    label: 'Send To Email',
    description: 'Optional override email address',
    placeholder: 'customer@example.com',
    acceptsVariables: true,
  }),

  // --- Invoice: Update ---
  updateInvoiceId: Workflow.string({
    label: 'Invoice ID',
    acceptsVariables: true,
  }),
  updateInvoiceCustomer: Workflow.select({
    label: 'Customer',
    description: 'Change the customer on this invoice',
    options: [],
  }),
  updateInvoiceItemId: Workflow.select({
    label: 'Item',
    description: 'Line item product/service',
    options: [] as { value: string; label: string }[],
  }),
  updateInvoiceAmount: Workflow.string({
    label: 'Amount',
    acceptsVariables: true,
  }),
  updateInvoiceDescription: Workflow.string({
    label: 'Description',
    acceptsVariables: true,
  }),
  updateInvoiceQuantity: Workflow.string({
    label: 'Quantity',
    acceptsVariables: true,
  }),
  updateInvoiceDocNumber: Workflow.string({
    label: 'Invoice Number',
    acceptsVariables: true,
  }),
  updateInvoiceDueDate: Workflow.string({
    label: 'Due Date',
    description: 'YYYY-MM-DD',
    acceptsVariables: true,
  }),
  updateInvoiceTxnDate: Workflow.string({
    label: 'Transaction Date',
    description: 'YYYY-MM-DD',
    acceptsVariables: true,
  }),
  updateInvoiceBillEmail: Workflow.string({
    label: 'Bill To Email',
    acceptsVariables: true,
  }),
  updateInvoiceCustomerMemo: Workflow.string({
    label: 'Customer Memo',
    acceptsVariables: true,
  }),
  updateInvoiceBillAddrLine1: Workflow.string({
    label: 'Billing Address Line 1',
    acceptsVariables: true,
  }),
  updateInvoiceBillAddrCity: Workflow.string({
    label: 'Billing City',
    acceptsVariables: true,
  }),
  updateInvoiceBillAddrPostalCode: Workflow.string({
    label: 'Billing Postal Code',
    acceptsVariables: true,
  }),
  updateInvoiceBillAddrState: Workflow.string({
    label: 'Billing State',
    acceptsVariables: true,
  }),

  // --- Invoice: Void ---
  voidInvoiceId: Workflow.string({
    label: 'Invoice ID',
    acceptsVariables: true,
  }),
}

export function invoiceComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      invoiceId: Workflow.string({ label: 'Invoice ID' }),
      docNumber: Workflow.string({ label: 'Invoice Number' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      balance: Workflow.string({ label: 'Balance' }),
      dueDate: Workflow.string({ label: 'Due Date' }),
      syncToken: Workflow.string({ label: 'Sync Token' }),
    }
  }
  if (operation === 'delete' || operation === 'void') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'get' || operation === 'update') {
    return {
      invoiceId: Workflow.string({ label: 'Invoice ID' }),
      docNumber: Workflow.string({ label: 'Invoice Number' }),
      customerName: Workflow.string({ label: 'Customer Name' }),
      customerId: Workflow.string({ label: 'Customer ID' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      balance: Workflow.string({ label: 'Balance' }),
      dueDate: Workflow.string({ label: 'Due Date' }),
      txnDate: Workflow.string({ label: 'Transaction Date' }),
      emailStatus: Workflow.string({ label: 'Email Status' }),
      status: Workflow.string({ label: 'Status' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      invoices: Workflow.string({ label: 'Invoices (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  if (operation === 'send') {
    return {
      invoiceId: Workflow.string({ label: 'Invoice ID' }),
      emailStatus: Workflow.string({ label: 'Email Status' }),
    }
  }
  return {}
}
