import { Workflow } from '@auxx/sdk'

export const customerInputs = {
  // --- Customer: Create ---
  createCustomerName: Workflow.string({
    label: 'Name',
    placeholder: 'Full name or business name',
    acceptsVariables: true,
    minLength: 1,
  }),
  createCustomerEmail: Workflow.string({
    label: 'Email',
    acceptsVariables: true,
  }),
  createCustomerPhone: Workflow.string({
    label: 'Phone',
    acceptsVariables: true,
  }),
  createCustomerDescription: Workflow.string({
    label: 'Description',
    acceptsVariables: true,
  }),
  createCustomerMetadata: Workflow.array({
    label: 'Metadata',
    items: Workflow.struct({
      key: Workflow.string({ label: 'Key', acceptsVariables: true }),
      value: Workflow.string({ label: 'Value', acceptsVariables: true }),
    }),
  }),
  createCustomerAddressLine1: Workflow.string({
    label: 'Address Line 1',
    acceptsVariables: true,
  }),
  createCustomerAddressLine2: Workflow.string({
    label: 'Address Line 2',
    acceptsVariables: true,
  }),
  createCustomerAddressCity: Workflow.string({
    label: 'City',
    acceptsVariables: true,
  }),
  createCustomerAddressState: Workflow.string({
    label: 'State',
    acceptsVariables: true,
  }),
  createCustomerAddressCountry: Workflow.string({
    label: 'Country',
    description: '2-letter ISO country code',
    acceptsVariables: true,
  }),
  createCustomerAddressPostalCode: Workflow.string({
    label: 'Postal Code',
    acceptsVariables: true,
  }),

  // --- Customer: Delete ---
  deleteCustomerId: Workflow.string({
    label: 'Customer ID',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),

  // --- Customer: Get ---
  getCustomerId: Workflow.string({
    label: 'Customer ID',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),

  // --- Customer: Get Many ---
  getManyCustomersReturnAll: Workflow.boolean({
    label: 'Return All',
    default: false,
  }),
  getManyCustomersLimit: Workflow.number({
    label: 'Limit',
    default: 50,
    min: 1,
    max: 100,
  }),
  getManyCustomersEmail: Workflow.string({
    label: 'Email Filter',
    description: 'Filter customers by exact email match',
    acceptsVariables: true,
  }),

  // --- Customer: Update ---
  updateCustomerId: Workflow.string({
    label: 'Customer ID',
    placeholder: 'cus_...',
    acceptsVariables: true,
  }),
  updateCustomerName: Workflow.string({
    label: 'Name',
    acceptsVariables: true,
  }),
  updateCustomerEmail: Workflow.string({
    label: 'Email',
    acceptsVariables: true,
  }),
  updateCustomerPhone: Workflow.string({
    label: 'Phone',
    acceptsVariables: true,
  }),
  updateCustomerDescription: Workflow.string({
    label: 'Description',
    acceptsVariables: true,
  }),
  updateCustomerMetadata: Workflow.array({
    label: 'Metadata',
    items: Workflow.struct({
      key: Workflow.string({ label: 'Key', acceptsVariables: true }),
      value: Workflow.string({ label: 'Value', acceptsVariables: true }),
    }),
  }),
  updateCustomerAddressLine1: Workflow.string({
    label: 'Address Line 1',
    acceptsVariables: true,
  }),
  updateCustomerAddressLine2: Workflow.string({
    label: 'Address Line 2',
    acceptsVariables: true,
  }),
  updateCustomerAddressCity: Workflow.string({
    label: 'City',
    acceptsVariables: true,
  }),
  updateCustomerAddressState: Workflow.string({
    label: 'State',
    acceptsVariables: true,
  }),
  updateCustomerAddressCountry: Workflow.string({
    label: 'Country',
    description: '2-letter ISO country code',
    acceptsVariables: true,
  }),
  updateCustomerAddressPostalCode: Workflow.string({
    label: 'Postal Code',
    acceptsVariables: true,
  }),
}

export function customerComputeOutputs(operation: string) {
  switch (operation) {
    case 'create':
      return {
        customerId: Workflow.string({ label: 'Customer ID' }),
        name: Workflow.string({ label: 'Name' }),
        email: Workflow.string({ label: 'Email' }),
        phone: Workflow.string({ label: 'Phone' }),
        description: Workflow.string({ label: 'Description' }),
        metadata: Workflow.string({ label: 'Metadata' }),
        created: Workflow.string({ label: 'Created' }),
      }
    case 'delete':
      return {
        customerId: Workflow.string({ label: 'Customer ID' }),
        deleted: Workflow.string({ label: 'Deleted' }),
      }
    case 'get':
      return {
        customerId: Workflow.string({ label: 'Customer ID' }),
        name: Workflow.string({ label: 'Name' }),
        email: Workflow.string({ label: 'Email' }),
        phone: Workflow.string({ label: 'Phone' }),
        description: Workflow.string({ label: 'Description' }),
        metadata: Workflow.string({ label: 'Metadata' }),
        created: Workflow.string({ label: 'Created' }),
        defaultSource: Workflow.string({ label: 'Default Source' }),
      }
    case 'getMany':
      return {
        customers: Workflow.array({
          label: 'Customers',
          items: Workflow.struct({
            id: Workflow.string({ label: 'ID' }),
            name: Workflow.string({ label: 'Name' }),
            email: Workflow.string({ label: 'Email' }),
          }),
        }),
        totalCount: Workflow.string({ label: 'Total Count' }),
        truncated: Workflow.string({ label: 'Truncated' }),
      }
    case 'update':
      return {
        customerId: Workflow.string({ label: 'Customer ID' }),
        name: Workflow.string({ label: 'Name' }),
        email: Workflow.string({ label: 'Email' }),
        metadata: Workflow.string({ label: 'Metadata' }),
      }
    default:
      return {}
  }
}
