import { Workflow } from '@auxx/sdk'

export const estimateInputs = {
  // --- Estimate: Create ---
  createEstimateCustomer: Workflow.select({
    label: 'Customer',
    description: 'Select a customer for this estimate',
    options: [],
  }),
  createEstimateItemId: Workflow.select({
    label: 'Item',
    description: 'Line item product/service',
    options: [],
  }),
  createEstimateAmount: Workflow.number({
    label: 'Amount',
    description: 'Line item amount',
  }),
  createEstimateDescription: Workflow.string({
    label: 'Description',
    description: 'Line item description',
    acceptsVariables: true,
  }),
  createEstimateDocNumber: Workflow.string({
    label: 'Estimate Number',
    description: 'Custom estimate number',
    acceptsVariables: true,
  }),
  createEstimateTxnDate: Workflow.string({
    label: 'Transaction Date',
    description: 'YYYY-MM-DD',
    placeholder: '2025-01-01',
    acceptsVariables: true,
  }),
  createEstimateBillEmail: Workflow.string({
    label: 'Bill To Email',
    placeholder: 'customer@example.com',
    acceptsVariables: true,
  }),
  createEstimateCustomerMemo: Workflow.string({
    label: 'Customer Memo',
    acceptsVariables: true,
  }),

  // --- Estimate: Delete ---
  deleteEstimateId: Workflow.string({
    label: 'Estimate ID',
    acceptsVariables: true,
  }),

  // --- Estimate: Get ---
  getEstimateId: Workflow.string({
    label: 'Estimate ID',
    acceptsVariables: true,
  }),

  // --- Estimate: Get Many ---
  getManyEstimateReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyEstimateLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyEstimateQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. TotalAmt > '100.00'",
    acceptsVariables: true,
  }),

  // --- Estimate: Send ---
  sendEstimateId: Workflow.string({
    label: 'Estimate ID',
    acceptsVariables: true,
  }),
  sendEstimateEmail: Workflow.string({
    label: 'Send To Email',
    description: 'Optional override email address',
    placeholder: 'customer@example.com',
    acceptsVariables: true,
  }),

  // --- Estimate: Update ---
  updateEstimateId: Workflow.string({
    label: 'Estimate ID',
    acceptsVariables: true,
  }),
  updateEstimateCustomer: Workflow.select({
    label: 'Customer',
    description: 'Change the customer on this estimate',
    options: [],
  }),
  updateEstimateItemId: Workflow.select({
    label: 'Item',
    description: 'Line item product/service',
    options: [],
  }),
  updateEstimateAmount: Workflow.number({
    label: 'Amount',
    description: 'Line item amount',
  }),
  updateEstimateDescription: Workflow.string({
    label: 'Description',
    acceptsVariables: true,
  }),
  updateEstimateDocNumber: Workflow.string({
    label: 'Estimate Number',
    acceptsVariables: true,
  }),
  updateEstimateTxnDate: Workflow.string({
    label: 'Transaction Date',
    description: 'YYYY-MM-DD',
    acceptsVariables: true,
  }),
  updateEstimateBillEmail: Workflow.string({
    label: 'Bill To Email',
    acceptsVariables: true,
  }),
  updateEstimateCustomerMemo: Workflow.string({
    label: 'Customer Memo',
    acceptsVariables: true,
  }),
}

export function estimateComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      estimateId: Workflow.string({ label: 'Estimate ID' }),
      docNumber: Workflow.string({ label: 'Estimate Number' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      syncToken: Workflow.string({ label: 'Sync Token' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'get' || operation === 'update') {
    return {
      estimateId: Workflow.string({ label: 'Estimate ID' }),
      docNumber: Workflow.string({ label: 'Estimate Number' }),
      customerName: Workflow.string({ label: 'Customer Name' }),
      customerId: Workflow.string({ label: 'Customer ID' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      txnDate: Workflow.string({ label: 'Transaction Date' }),
      emailStatus: Workflow.string({ label: 'Email Status' }),
      status: Workflow.string({ label: 'Status' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      estimates: Workflow.string({ label: 'Estimates (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  if (operation === 'send') {
    return {
      estimateId: Workflow.string({ label: 'Estimate ID' }),
      emailStatus: Workflow.string({ label: 'Email Status' }),
    }
  }
  return {}
}
