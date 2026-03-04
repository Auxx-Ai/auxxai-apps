import { Workflow } from '@auxx/sdk'

export const customerCardInputs = {
  // --- Customer Card: Add ---
  addCardCustomerId: Workflow.string({
    label: 'Customer ID',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),
  addCardToken: Workflow.string({
    label: 'Card Token',
    placeholder: 'tok_...',
    acceptsVariables: true,
  }),

  // --- Customer Card: Get ---
  getCardCustomerId: Workflow.string({
    label: 'Customer ID',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),
  getCardSourceId: Workflow.string({
    label: 'Source ID',
    placeholder: 'card_... or src_...',
    acceptsVariables: true,
  }),

  // --- Customer Card: Remove ---
  removeCardCustomerId: Workflow.string({
    label: 'Customer ID',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),
  removeCardId: Workflow.string({
    label: 'Card ID',
    placeholder: 'card_...',
    acceptsVariables: true,
  }),
}

export function customerCardComputeOutputs(operation: string) {
  switch (operation) {
    case 'add':
      return {
        cardId: Workflow.string({ label: 'Card ID' }),
        brand: Workflow.string({ label: 'Brand' }),
        last4: Workflow.string({ label: 'Last 4' }),
        expMonth: Workflow.string({ label: 'Exp Month' }),
        expYear: Workflow.string({ label: 'Exp Year' }),
      }
    case 'get':
      return {
        cardId: Workflow.string({ label: 'Card ID' }),
        brand: Workflow.string({ label: 'Brand' }),
        last4: Workflow.string({ label: 'Last 4' }),
        expMonth: Workflow.string({ label: 'Exp Month' }),
        expYear: Workflow.string({ label: 'Exp Year' }),
        funding: Workflow.string({ label: 'Funding' }),
      }
    case 'remove':
      return {
        cardId: Workflow.string({ label: 'Card ID' }),
        deleted: Workflow.string({ label: 'Deleted' }),
      }
    default:
      return {}
  }
}
