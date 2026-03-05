import { Workflow } from '@auxx/sdk'

export const paymentInputs = {
  // --- Payment: Create ---
  createPaymentCustomer: Workflow.select({
    label: 'Customer',
    description: 'Select a customer',
    options: [],
  }),
  createPaymentTotalAmt: Workflow.number({
    label: 'Total Amount',
    description: 'Payment amount',
    required: true,
  }),
  createPaymentTxnDate: Workflow.string({
    label: 'Transaction Date',
    description: 'YYYY-MM-DD',
    acceptsVariables: true,
  }),

  // --- Payment: Delete ---
  deletePaymentId: Workflow.string({
    label: 'Payment ID',
    acceptsVariables: true,
  }),

  // --- Payment: Get ---
  getPaymentId: Workflow.string({
    label: 'Payment ID',
    acceptsVariables: true,
  }),

  // --- Payment: Get Many ---
  getManyPaymentReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyPaymentLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyPaymentQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. TotalAmt > '100.00'",
    acceptsVariables: true,
  }),

  // --- Payment: Send ---
  sendPaymentId: Workflow.string({
    label: 'Payment ID',
    acceptsVariables: true,
  }),
  sendPaymentEmail: Workflow.string({
    label: 'Email (optional)',
    description: 'Override recipient email',
    acceptsVariables: true,
  }),

  // --- Payment: Update ---
  updatePaymentId: Workflow.string({
    label: 'Payment ID',
    acceptsVariables: true,
  }),
  updatePaymentTxnDate: Workflow.string({
    label: 'Transaction Date',
    description: 'YYYY-MM-DD',
    acceptsVariables: true,
  }),

  // --- Payment: Void ---
  voidPaymentId: Workflow.string({
    label: 'Payment ID',
    acceptsVariables: true,
  }),
}

export function paymentComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      paymentId: Workflow.string({ label: 'Payment ID' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      customerId: Workflow.string({ label: 'Customer ID' }),
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
      paymentId: Workflow.string({ label: 'Payment ID' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      customerName: Workflow.string({ label: 'Customer Name' }),
      customerId: Workflow.string({ label: 'Customer ID' }),
      txnDate: Workflow.string({ label: 'Transaction Date' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      payments: Workflow.string({ label: 'Payments (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  if (operation === 'send') {
    return {
      paymentId: Workflow.string({ label: 'Payment ID' }),
    }
  }
  return {}
}
