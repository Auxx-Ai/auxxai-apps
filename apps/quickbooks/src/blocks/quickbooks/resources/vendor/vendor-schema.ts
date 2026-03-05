import { Workflow } from '@auxx/sdk'

export const vendorInputs = {
  // --- Vendor: Create ---
  createVendorDisplayName: Workflow.string({
    label: 'Display Name',
    description: 'Required. Display name (must be unique).',
    placeholder: 'Acme Corp',
    acceptsVariables: true,
  }),
  createVendorGivenName: Workflow.string({
    label: 'First Name',
    acceptsVariables: true,
  }),
  createVendorFamilyName: Workflow.string({
    label: 'Last Name',
    acceptsVariables: true,
  }),
  createVendorCompanyName: Workflow.string({
    label: 'Company Name',
    acceptsVariables: true,
  }),
  createVendorEmail: Workflow.string({
    label: 'Email',
    placeholder: 'vendor@example.com',
    acceptsVariables: true,
  }),
  createVendorPhone: Workflow.string({
    label: 'Phone',
    acceptsVariables: true,
  }),
  createVendorAcctNum: Workflow.string({
    label: 'Account Number',
    description: 'Vendor account number',
    acceptsVariables: true,
  }),
  createVendorVendor1099: Workflow.boolean({
    label: '1099 Vendor',
    description: 'Eligible for 1099 reporting',
    default: false,
  }),

  // --- Vendor: Get ---
  getVendorId: Workflow.string({
    label: 'Vendor ID',
    acceptsVariables: true,
  }),

  // --- Vendor: Get Many ---
  getManyVendorReturnAll: Workflow.boolean({
    label: 'Return All',
    description: 'Return all results',
    default: false,
  }),
  getManyVendorLimit: Workflow.number({
    label: 'Limit',
    description: 'Max results (1-1000)',
    default: 50,
  }),
  getManyVendorQuery: Workflow.string({
    label: 'Filter (WHERE clause)',
    description: "e.g. DisplayName = 'Acme'",
    acceptsVariables: true,
  }),

  // --- Vendor: Update ---
  updateVendorId: Workflow.string({
    label: 'Vendor ID',
    acceptsVariables: true,
  }),
  updateVendorDisplayName: Workflow.string({
    label: 'Display Name',
    acceptsVariables: true,
  }),
  updateVendorGivenName: Workflow.string({
    label: 'First Name',
    acceptsVariables: true,
  }),
  updateVendorFamilyName: Workflow.string({
    label: 'Last Name',
    acceptsVariables: true,
  }),
  updateVendorCompanyName: Workflow.string({
    label: 'Company Name',
    acceptsVariables: true,
  }),
  updateVendorEmail: Workflow.string({
    label: 'Email',
    acceptsVariables: true,
  }),
  updateVendorPhone: Workflow.string({
    label: 'Phone',
    acceptsVariables: true,
  }),
  updateVendorAcctNum: Workflow.string({
    label: 'Account Number',
    acceptsVariables: true,
  }),
  updateVendorVendor1099: Workflow.boolean({
    label: '1099 Vendor',
    description: 'Eligible for 1099 reporting',
    default: false,
  }),
}

export function vendorComputeOutputs(operation: string) {
  if (operation === 'create') {
    return {
      vendorId: Workflow.string({ label: 'Vendor ID' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      syncToken: Workflow.string({ label: 'Sync Token' }),
    }
  }
  if (operation === 'get') {
    return {
      vendorId: Workflow.string({ label: 'Vendor ID' }),
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
      vendors: Workflow.string({ label: 'Vendors (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  if (operation === 'update') {
    return {
      vendorId: Workflow.string({ label: 'Vendor ID' }),
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
