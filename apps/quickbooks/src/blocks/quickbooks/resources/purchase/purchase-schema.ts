import { Workflow } from '@auxx/sdk'

export const purchaseInputs = {
  // --- Purchase: Get ---
  getPurchaseId: Workflow.string({
    label: 'Purchase ID',
    acceptsVariables: true,
  }),

  // --- Purchase: Get Many ---
  getManyPurchaseReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyPurchaseLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyPurchaseQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. TotalAmt > '100'",
    acceptsVariables: true,
  }),
}

export function purchaseComputeOutputs(operation: string) {
  if (operation === 'get') {
    return {
      purchaseId: Workflow.string({ label: 'Purchase ID' }),
      totalAmt: Workflow.string({ label: 'Total Amount' }),
      txnDate: Workflow.string({ label: 'Transaction Date' }),
      accountName: Workflow.string({ label: 'Account Name' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      purchases: Workflow.string({ label: 'Purchases (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
