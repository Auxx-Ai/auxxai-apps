import { Workflow } from '@auxx/sdk'

export const tokenInputs = {
  // --- Token: Create ---
  createTokenType: Workflow.select({
    label: 'Token Type',
    options: [{ value: 'cardToken', label: 'Card Token' }],
    default: 'cardToken',
  }),
  createTokenCardNumber: Workflow.string({
    label: 'Card Number',
    placeholder: '4242424242424242',
    acceptsVariables: true,
  }),
  createTokenExpMonth: Workflow.string({
    label: 'Expiration Month',
    placeholder: '12',
    acceptsVariables: true,
  }),
  createTokenExpYear: Workflow.string({
    label: 'Expiration Year',
    placeholder: '2027',
    acceptsVariables: true,
  }),
  createTokenCvc: Workflow.string({
    label: 'CVC',
    placeholder: '123',
    acceptsVariables: true,
  }),
}

export function tokenComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      tokenId: Workflow.string({ label: 'Token ID' }),
      type: Workflow.string({ label: 'Type' }),
      cardId: Workflow.string({ label: 'Card ID' }),
      cardBrand: Workflow.string({ label: 'Card Brand' }),
      cardLast4: Workflow.string({ label: 'Card Last 4' }),
    }
  }
  return {}
}
