// src/blocks/shopify/resources/customer/customer-schema.ts

import { Workflow } from '@auxx/sdk'

export const customerInputs = {
  // --- Customer: Create ---
  createFirstName: Workflow.string({ label: 'First Name', acceptsVariables: true }),
  createLastName: Workflow.string({ label: 'Last Name', acceptsVariables: true }),
  createEmail: Workflow.string({
    label: 'Email',
    placeholder: 'customer@example.com',
    acceptsVariables: true,
  }),
  createPhone: Workflow.string({
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
  createVerifiedEmail: Workflow.select({
    label: 'Verified Email',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: 'true',
  }),
  createSendEmailInvite: Workflow.select({
    label: 'Send Email Invite',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  createTaxExempt: Workflow.select({
    label: 'Tax Exempt',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
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
  updateEmail: Workflow.string({ label: 'Email', acceptsVariables: true }),
  updatePhone: Workflow.string({ label: 'Phone', acceptsVariables: true }),
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

export function customerComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      customerId: Workflow.string({ label: 'Customer ID' }),
      firstName: Workflow.string({ label: 'First Name' }),
      lastName: Workflow.string({ label: 'Last Name' }),
      email: Workflow.string({ label: 'Email' }),
      phone: Workflow.string({ label: 'Phone' }),
      tags: Workflow.string({ label: 'Tags' }),
      note: Workflow.string({ label: 'Note' }),
      ordersCount: Workflow.string({ label: 'Orders Count' }),
      totalSpent: Workflow.string({ label: 'Total Spent' }),
      addresses: Workflow.string({ label: 'Addresses (JSON)' }),
      createdAt: Workflow.string({ label: 'Created At' }),
      updatedAt: Workflow.string({ label: 'Updated At' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany' || operation === 'search') {
    return {
      customers: Workflow.string({ label: 'Customers (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
