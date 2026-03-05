import { Workflow } from '@auxx/sdk'

export const customerInputs = {
  // --- Customer: Create ---
  createCustomerDisplayName: Workflow.string({
    label: 'Display Name',
    description: 'Display name (must be unique)',
    placeholder: 'John Doe',
    acceptsVariables: true,
  }),
  createCustomerGivenName: Workflow.string({
    label: 'First Name',
    acceptsVariables: true,
  }),
  createCustomerFamilyName: Workflow.string({
    label: 'Last Name',
    acceptsVariables: true,
  }),
  createCustomerCompanyName: Workflow.string({
    label: 'Company Name',
    acceptsVariables: true,
  }),
  createCustomerEmail: Workflow.string({
    label: 'Email',
    placeholder: 'john@example.com',
    acceptsVariables: true,
  }),
  createCustomerPhone: Workflow.string({
    label: 'Phone',
    acceptsVariables: true,
  }),
  createCustomerBillAddrLine1: Workflow.string({
    label: 'Billing Address Line 1',
    acceptsVariables: true,
  }),
  createCustomerBillAddrCity: Workflow.string({
    label: 'Billing City',
    acceptsVariables: true,
  }),
  createCustomerBillAddrPostalCode: Workflow.string({
    label: 'Billing Postal Code',
    acceptsVariables: true,
  }),
  createCustomerBillAddrState: Workflow.string({
    label: 'Billing State',
    acceptsVariables: true,
  }),
  createCustomerTaxable: Workflow.boolean({
    label: 'Taxable',
    description: 'Subject to tax',
    default: false,
  }),
  createCustomerPreferredDeliveryMethod: Workflow.select({
    label: 'Preferred Delivery Method',
    options: [
      { value: 'Print', label: 'Print' },
      { value: 'Email', label: 'Email' },
      { value: 'None', label: 'None' },
    ],
    default: 'None',
  }),

  // --- Customer: Get ---
  getCustomerId: Workflow.string({
    label: 'Customer ID',
    acceptsVariables: true,
  }),

  // --- Customer: Get Many ---
  getManyCustomerReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyCustomerLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyCustomerQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. DisplayName = 'John'",
    acceptsVariables: true,
  }),

  // --- Customer: Update ---
  updateCustomerId: Workflow.string({
    label: 'Customer ID',
    acceptsVariables: true,
  }),
  updateCustomerDisplayName: Workflow.string({
    label: 'Display Name',
    acceptsVariables: true,
  }),
  updateCustomerGivenName: Workflow.string({
    label: 'First Name',
    acceptsVariables: true,
  }),
  updateCustomerFamilyName: Workflow.string({
    label: 'Last Name',
    acceptsVariables: true,
  }),
  updateCustomerCompanyName: Workflow.string({
    label: 'Company Name',
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
  updateCustomerBillAddrLine1: Workflow.string({
    label: 'Billing Address Line 1',
    acceptsVariables: true,
  }),
  updateCustomerBillAddrCity: Workflow.string({
    label: 'Billing City',
    acceptsVariables: true,
  }),
  updateCustomerBillAddrPostalCode: Workflow.string({
    label: 'Billing Postal Code',
    acceptsVariables: true,
  }),
  updateCustomerBillAddrState: Workflow.string({
    label: 'Billing State',
    acceptsVariables: true,
  }),
}

export function customerComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      customerId: Workflow.string({ label: 'Customer ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      syncToken: Workflow.string({ label: 'Sync Token' }),
    }
  }
  if (operation === 'get') {
    return {
      customerId: Workflow.string({ label: 'Customer ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      givenName: Workflow.string({ label: 'First Name' }),
      familyName: Workflow.string({ label: 'Last Name' }),
      companyName: Workflow.string({ label: 'Company Name' }),
      email: Workflow.string({ label: 'Email' }),
      phone: Workflow.string({ label: 'Phone' }),
      balance: Workflow.string({ label: 'Balance' }),
      active: Workflow.string({ label: 'Active' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  if (operation === 'getMany') {
    return {
      customers: Workflow.string({ label: 'Customers (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  if (operation === 'update') {
    return {
      customerId: Workflow.string({ label: 'Customer ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      givenName: Workflow.string({ label: 'First Name' }),
      familyName: Workflow.string({ label: 'Last Name' }),
      companyName: Workflow.string({ label: 'Company Name' }),
      email: Workflow.string({ label: 'Email' }),
      phone: Workflow.string({ label: 'Phone' }),
      balance: Workflow.string({ label: 'Balance' }),
      active: Workflow.string({ label: 'Active' }),
      raw: Workflow.string({ label: 'Raw Response (JSON)' }),
    }
  }
  return {}
}
