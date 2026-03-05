import { Workflow } from '@auxx/sdk'

export const billInputs = {
  // --- Bill: Create ---
  createBillVendor: Workflow.select({
    label: 'Vendor',
    description: 'Select a vendor for this bill',
    options: [],
  }),
  createBillDetailType: Workflow.select({
    label: 'Detail Type',
    description: 'Type of line item detail',
    options: [
      { value: 'AccountBasedExpenseLineDetail', label: 'Account-Based Expense' },
      { value: 'ItemBasedExpenseLineDetail', label: 'Item-Based Expense' },
    ],
    default: 'AccountBasedExpenseLineDetail',
  }),
  createBillAmount: Workflow.number({
    label: 'Amount',
    description: 'Line item amount',
  }),
  createBillDescription: Workflow.string({
    label: 'Description',
    description: 'Line item description',
    acceptsVariables: true,
  }),
  createBillAccountId: Workflow.select({
    label: 'Account',
    description: 'Expense account for the line item',
    options: [],
  }),
  createBillItemId: Workflow.select({
    label: 'Item',
    description: 'Product/service item for the line item',
    options: [],
  }),
  createBillDueDate: Workflow.string({
    label: 'Due Date',
    description: 'YYYY-MM-DD',
    placeholder: '2025-12-31',
    acceptsVariables: true,
  }),
  createBillTxnDate: Workflow.string({
    label: 'Transaction Date',
    description: 'YYYY-MM-DD',
    placeholder: '2025-01-01',
    acceptsVariables: true,
  }),

  // --- Bill: Delete ---
  deleteBillId: Workflow.string({
    label: 'Bill ID',
    acceptsVariables: true,
  }),

  // --- Bill: Get ---
  getBillId: Workflow.string({
    label: 'Bill ID',
    acceptsVariables: true,
  }),

  // --- Bill: Get Many ---
  getManyBillReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyBillLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyBillQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. TotalAmt > '100.00'",
    acceptsVariables: true,
  }),

  // --- Bill: Update ---
  updateBillId: Workflow.string({
    label: 'Bill ID',
    acceptsVariables: true,
  }),
  updateBillVendor: Workflow.select({
    label: 'Vendor',
    description: 'Change the vendor on this bill',
    options: [],
  }),
  updateBillDetailType: Workflow.select({
    label: 'Detail Type',
    description: 'Type of line item detail',
    options: [
      { value: 'AccountBasedExpenseLineDetail', label: 'Account-Based Expense' },
      { value: 'ItemBasedExpenseLineDetail', label: 'Item-Based Expense' },
    ],
  }),
  updateBillAmount: Workflow.number({
    label: 'Amount',
    description: 'Line item amount',
  }),
  updateBillDescription: Workflow.string({
    label: 'Description',
    acceptsVariables: true,
  }),
  updateBillAccountId: Workflow.select({
    label: 'Account',
    description: 'Expense account for the line item',
    options: [],
  }),
  updateBillItemId: Workflow.select({
    label: 'Item',
    description: 'Product/service item for the line item',
    options: [],
  }),
  updateBillDueDate: Workflow.string({
    label: 'Due Date',
    description: 'YYYY-MM-DD',
    acceptsVariables: true,
  }),
  updateBillTxnDate: Workflow.string({
    label: 'Transaction Date',
    description: 'YYYY-MM-DD',
    acceptsVariables: true,
  }),
}

export function billComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      billId: Workflow.string({ label: 'Bill ID' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      balance: Workflow.string({ label: 'Balance' }),
      vendorName: Workflow.string({ label: 'Vendor Name' }),
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
      billId: Workflow.string({ label: 'Bill ID' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      balance: Workflow.string({ label: 'Balance' }),
      vendorName: Workflow.string({ label: 'Vendor Name' }),
      dueDate: Workflow.string({ label: 'Due Date' }),
      txnDate: Workflow.string({ label: 'Transaction Date' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      bills: Workflow.string({ label: 'Bills (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
