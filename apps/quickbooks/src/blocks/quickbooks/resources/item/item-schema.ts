import { Workflow } from '@auxx/sdk'

export const itemInputs = {
  // --- Item: Get ---
  getItemId: Workflow.string({
    label: 'Item ID',
    acceptsVariables: true,
  }),

  // --- Item: Get Many ---
  getManyItemReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyItemLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyItemQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. Name = 'Widget'",
    acceptsVariables: true,
  }),
}

export function itemComputeOutputs(operation: string) {
  if (operation === 'get') {
    return {
      itemId: Workflow.string({ label: 'Item ID' }),
      name: Workflow.string({ label: 'Name' }),
      type: Workflow.string({ label: 'Type' }),
      unitPrice: Workflow.string({ label: 'Unit Price' }),
      description: Workflow.string({ label: 'Description' }),
      active: Workflow.string({ label: 'Active' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      items: Workflow.string({ label: 'Items (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
