// src/blocks/shopify/resources/customer/customer-schema.ts

import { Workflow } from '@auxx/sdk'

export const customerInputs = {
  // --- Customer: Create ---
  createFirstName: Workflow.string({ label: 'First Name', acceptsVariables: true }),
  createLastName: Workflow.string({ label: 'Last Name', acceptsVariables: true }),
  createEmail: Workflow.email({
    label: 'Email',
    placeholder: 'customer@example.com',
    acceptsVariables: true,
  }),
  createPhone: Workflow.phone({
    label: 'Phone',
    placeholder: '+1234567890',
    acceptsVariables: true,
  }),
  createTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated tags',
    acceptsVariables: true,
  }),
  createNote: Workflow.string({ label: 'Note', acceptsVariables: true }),
  createVerifiedEmail: Workflow.boolean({
    label: 'Verified Email',
    default: true,
  }),
  createSendEmailInvite: Workflow.boolean({
    label: 'Send Email Invite',
    default: false,
  }),
  createTaxExempt: Workflow.boolean({
    label: 'Tax Exempt',
    default: false,
  }),
  createAddress1: Workflow.string({ label: 'Address Line 1', acceptsVariables: true }),
  createAddress2: Workflow.string({ label: 'Address Line 2', acceptsVariables: true }),
  createCity: Workflow.string({ label: 'City', acceptsVariables: true }),
  createProvince: Workflow.string({ label: 'Province/State', acceptsVariables: true }),
  createCountry: Workflow.string({ label: 'Country', acceptsVariables: true }),
  createZip: Workflow.string({ label: 'Zip/Postal Code', acceptsVariables: true }),
  createCompany: Workflow.string({ label: 'Company', acceptsVariables: true }),

  // --- Customer: Update ---
  updateCustomerId: Workflow.string({ label: 'Customer ID', acceptsVariables: true }),
  updateFirstName: Workflow.string({ label: 'First Name', acceptsVariables: true }),
  updateLastName: Workflow.string({ label: 'Last Name', acceptsVariables: true }),
  updateEmail: Workflow.email({ label: 'Email', acceptsVariables: true }),
  updatePhone: Workflow.phone({ label: 'Phone', acceptsVariables: true }),
  updateTags: Workflow.string({
    label: 'Tags',
    description: 'Comma-separated (replaces existing)',
    acceptsVariables: true,
  }),
  updateNote: Workflow.string({ label: 'Note', acceptsVariables: true }),
  updateTaxExempt: Workflow.select({
    label: 'Tax Exempt',
    options: [
      { value: '', label: 'No change' },
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: '',
  }),

  // --- Customer: Get ---
  getCustomerId: Workflow.string({ label: 'Customer ID', acceptsVariables: true }),
  getFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields to include',
    acceptsVariables: true,
  }),

  // --- Customer: Get Many ---
  getManyLimit: Workflow.select({
    label: 'Limit',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
    ],
    default: '50',
  }),
  getManyCreatedAtMin: Workflow.datetime({
    label: 'Created After',
    placeholder: '2026-01-01T00:00:00Z',
    acceptsVariables: true,
  }),
  getManyCreatedAtMax: Workflow.datetime({ label: 'Created Before', acceptsVariables: true }),
  getManyUpdatedAtMin: Workflow.datetime({ label: 'Updated After', acceptsVariables: true }),
  getManyUpdatedAtMax: Workflow.datetime({ label: 'Updated Before', acceptsVariables: true }),
  getManyFields: Workflow.string({
    label: 'Fields',
    description: 'Comma-separated fields to include',
    acceptsVariables: true,
  }),

  // --- Customer: Delete ---
  deleteCustomerId: Workflow.string({ label: 'Customer ID', acceptsVariables: true }),

  // --- Customer: Search ---
  searchQuery: Workflow.string({
    label: 'Query',
    description: 'Search query (e.g., "email:test@example.com" or "first_name:John")',
    acceptsVariables: true,
  }),
  searchLimit: Workflow.select({
    label: 'Limit',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
    ],
    default: '50',
  }),
}

const customerFields = {
  customerId: Workflow.string(),
  firstName: Workflow.string(),
  lastName: Workflow.string(),
  email: Workflow.email(),
  phone: Workflow.phone(),
  tags: Workflow.string(),
  note: Workflow.string(),
  ordersCount: Workflow.number({ integer: true }),
  totalSpent: Workflow.currency(),
  addresses: Workflow.string(),
  createdAt: Workflow.datetime(),
  updatedAt: Workflow.datetime(),
}

export function customerComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      customer: Workflow.struct(customerFields, { label: 'customer' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.boolean({ label: 'success' }),
    }
  }
  if (operation === 'getMany' || operation === 'search') {
    return {
      customers: Workflow.array({
        label: 'customers',
        items: Workflow.struct(customerFields, { label: 'customer' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  return {}
}
