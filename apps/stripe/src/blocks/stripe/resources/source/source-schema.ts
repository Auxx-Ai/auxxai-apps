import { Workflow } from '@auxx/sdk'

export const sourceInputs = {
  // --- Source: Create ---
  createSourceCustomerId: Workflow.string({
    label: 'Customer ID',
    description: 'Customer to attach the source to',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),
  createSourceType: Workflow.select({
    label: 'Source Type',
    options: [{ value: 'wechat', label: 'WeChat' }],
    default: 'wechat',
  }),
  createSourceAmount: Workflow.number({
    label: 'Amount',
    description: 'Amount in cents',
    min: 1,
  }),
  createSourceCurrency: Workflow.string({
    label: 'Currency',
    placeholder: 'usd',
    acceptsVariables: true,
  }),
  createSourceMetadata: Workflow.array({
    label: 'Metadata',
    items: Workflow.struct({
      key: Workflow.string({ label: 'Key', acceptsVariables: true }),
      value: Workflow.string({ label: 'Value', acceptsVariables: true }),
    }),
  }),

  // --- Source: Delete ---
  deleteSourceCustomerId: Workflow.string({
    label: 'Customer ID',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),
  deleteSourceId: Workflow.string({
    label: 'Source ID',
    placeholder: 'src_...',
    acceptsVariables: true,
  }),

  // --- Source: Get ---
  getSourceId: Workflow.string({
    label: 'Source ID',
    placeholder: 'src_...',
    acceptsVariables: true,
  }),
}

export function sourceComputeOutputs(operation: string) {
  switch (operation) {
    case 'create':
      return {
        sourceId: Workflow.string({ label: 'Source ID' }),
        type: Workflow.string({ label: 'Type' }),
        status: Workflow.string({ label: 'Status' }),
        amount: Workflow.string({ label: 'Amount' }),
        currency: Workflow.string({ label: 'Currency' }),
      }
    case 'delete':
      return {
        sourceId: Workflow.string({ label: 'Source ID' }),
        deleted: Workflow.string({ label: 'Deleted' }),
      }
    case 'get':
      return {
        sourceId: Workflow.string({ label: 'Source ID' }),
        type: Workflow.string({ label: 'Type' }),
        status: Workflow.string({ label: 'Status' }),
        amount: Workflow.string({ label: 'Amount' }),
        currency: Workflow.string({ label: 'Currency' }),
      }
    default:
      return {}
  }
}
