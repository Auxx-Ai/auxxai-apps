// src/blocks/shopify/resources/customer-address/customer-address-schema.ts

import { Workflow } from '@auxx/sdk'

export const customerAddressInputs = {
  // Shared -- required for all operations
  customerId: Workflow.string({ label: 'Customer ID', acceptsVariables: true }),

  // --- Address: Create ---
  createAddress1: Workflow.string({ label: 'Address Line 1', acceptsVariables: true }),
  createAddress2: Workflow.string({ label: 'Address Line 2', acceptsVariables: true }),
  createCity: Workflow.string({ label: 'City', acceptsVariables: true }),
  createProvince: Workflow.string({ label: 'Province/State', acceptsVariables: true }),
  createCountry: Workflow.string({ label: 'Country', acceptsVariables: true }),
  createZip: Workflow.string({ label: 'Zip/Postal Code', acceptsVariables: true }),
  createPhone: Workflow.string({ label: 'Phone', acceptsVariables: true }),
  createCompany: Workflow.string({ label: 'Company', acceptsVariables: true }),
  createFirstName: Workflow.string({ label: 'First Name', acceptsVariables: true }),
  createLastName: Workflow.string({ label: 'Last Name', acceptsVariables: true }),
  createIsDefault: Workflow.select({
    label: 'Set as Default',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),

  // --- Address: Update ---
  updateAddressId: Workflow.string({ label: 'Address ID', acceptsVariables: true }),
  updateAddress1: Workflow.string({ label: 'Address Line 1', acceptsVariables: true }),
  updateAddress2: Workflow.string({ label: 'Address Line 2', acceptsVariables: true }),
  updateCity: Workflow.string({ label: 'City', acceptsVariables: true }),
  updateProvince: Workflow.string({ label: 'Province/State', acceptsVariables: true }),
  updateCountry: Workflow.string({ label: 'Country', acceptsVariables: true }),
  updateZip: Workflow.string({ label: 'Zip/Postal Code', acceptsVariables: true }),
  updatePhone: Workflow.string({ label: 'Phone', acceptsVariables: true }),
  updateCompany: Workflow.string({ label: 'Company', acceptsVariables: true }),
  updateFirstName: Workflow.string({ label: 'First Name', acceptsVariables: true }),
  updateLastName: Workflow.string({ label: 'Last Name', acceptsVariables: true }),

  // --- Address: Get ---
  getAddressId: Workflow.string({ label: 'Address ID', acceptsVariables: true }),

  // --- Address: Get Many ---
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

  // --- Address: Delete ---
  deleteAddressId: Workflow.string({ label: 'Address ID', acceptsVariables: true }),

  // --- Address: Set Default ---
  setDefaultAddressId: Workflow.string({ label: 'Address ID', acceptsVariables: true }),
}

export function customerAddressComputeOutputs(operation: string) {
  if (
    operation === 'create' ||
    operation === 'get' ||
    operation === 'update' ||
    operation === 'setDefault'
  ) {
    return {
      addressId: Workflow.string({ label: 'Address ID' }),
      address1: Workflow.string({ label: 'Address Line 1' }),
      address2: Workflow.string({ label: 'Address Line 2' }),
      city: Workflow.string({ label: 'City' }),
      province: Workflow.string({ label: 'Province' }),
      country: Workflow.string({ label: 'Country' }),
      zip: Workflow.string({ label: 'Zip' }),
      phone: Workflow.string({ label: 'Phone' }),
      company: Workflow.string({ label: 'Company' }),
      firstName: Workflow.string({ label: 'First Name' }),
      lastName: Workflow.string({ label: 'Last Name' }),
      isDefault: Workflow.string({ label: 'Is Default' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      addresses: Workflow.string({ label: 'Addresses (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
