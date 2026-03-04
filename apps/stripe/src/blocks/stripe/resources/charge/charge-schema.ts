import { Workflow } from '@auxx/sdk'

export const chargeInputs = {
  // --- Charge: Create ---
  createChargeCustomerId: Workflow.string({
    label: 'Customer ID',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),
  createChargeAmount: Workflow.number({
    label: 'Amount',
    description: 'Amount in cents (e.g., 100 for $1.00)',
    min: 1,
  }),
  createChargeCurrency: Workflow.string({
    label: 'Currency',
    placeholder: 'usd',
    acceptsVariables: true,
  }),
  createChargeSourceId: Workflow.string({
    label: 'Source ID',
    placeholder: 'src_... or tok_...',
    acceptsVariables: true,
  }),
  createChargeDescription: Workflow.string({
    label: 'Description',
    acceptsVariables: true,
  }),
  createChargeReceiptEmail: Workflow.string({
    label: 'Receipt Email',
    acceptsVariables: true,
  }),
  createChargeMetadata: Workflow.array({
    label: 'Metadata',
    items: Workflow.struct({
      key: Workflow.string({ label: 'Key', acceptsVariables: true }),
      value: Workflow.string({ label: 'Value', acceptsVariables: true }),
    }),
  }),

  // --- Charge: Get ---
  getChargeId: Workflow.string({
    label: 'Charge ID',
    placeholder: 'ch_...',
    acceptsVariables: true,
  }),

  // --- Charge: Get Many ---
  getManyChargesReturnAll: Workflow.boolean({
    label: 'Return All',
    default: false,
  }),
  getManyChargesLimit: Workflow.number({
    label: 'Limit',
    default: 50,
    min: 1,
    max: 100,
  }),

  // --- Charge: Update ---
  updateChargeId: Workflow.string({
    label: 'Charge ID',
    placeholder: 'ch_...',
    acceptsVariables: true,
  }),
  updateChargeDescription: Workflow.string({
    label: 'Description',
    acceptsVariables: true,
  }),
  updateChargeReceiptEmail: Workflow.string({
    label: 'Receipt Email',
    acceptsVariables: true,
  }),
  updateChargeMetadata: Workflow.array({
    label: 'Metadata',
    items: Workflow.struct({
      key: Workflow.string({ label: 'Key', acceptsVariables: true }),
      value: Workflow.string({ label: 'Value', acceptsVariables: true }),
    }),
  }),
}

export function chargeComputeOutputs(operation: string) {
  switch (operation) {
    case 'create':
      return {
        chargeId: Workflow.string({ label: 'Charge ID' }),
        amount: Workflow.string({ label: 'Amount' }),
        currency: Workflow.string({ label: 'Currency' }),
        status: Workflow.string({ label: 'Status' }),
        paid: Workflow.string({ label: 'Paid' }),
        receiptUrl: Workflow.string({ label: 'Receipt URL' }),
      }
    case 'get':
      return {
        chargeId: Workflow.string({ label: 'Charge ID' }),
        amount: Workflow.string({ label: 'Amount' }),
        currency: Workflow.string({ label: 'Currency' }),
        status: Workflow.string({ label: 'Status' }),
        paid: Workflow.string({ label: 'Paid' }),
        customerId: Workflow.string({ label: 'Customer ID' }),
        description: Workflow.string({ label: 'Description' }),
        receiptUrl: Workflow.string({ label: 'Receipt URL' }),
        metadata: Workflow.string({ label: 'Metadata' }),
      }
    case 'getMany':
      return {
        charges: Workflow.array({
          label: 'Charges',
          items: Workflow.struct({
            id: Workflow.string({ label: 'ID' }),
            amount: Workflow.string({ label: 'Amount' }),
            currency: Workflow.string({ label: 'Currency' }),
            status: Workflow.string({ label: 'Status' }),
          }),
        }),
        totalCount: Workflow.string({ label: 'Total Count' }),
        truncated: Workflow.string({ label: 'Truncated' }),
      }
    case 'update':
      return {
        chargeId: Workflow.string({ label: 'Charge ID' }),
        amount: Workflow.string({ label: 'Amount' }),
        status: Workflow.string({ label: 'Status' }),
        description: Workflow.string({ label: 'Description' }),
        metadata: Workflow.string({ label: 'Metadata' }),
      }
    default:
      return {}
  }
}
