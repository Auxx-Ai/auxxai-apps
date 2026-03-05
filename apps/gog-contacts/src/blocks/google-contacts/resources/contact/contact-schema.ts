import { Workflow } from '@auxx/sdk'

export const contactInputs = {
  // --- Contact: Create ---
  createGivenName: Workflow.string({
    label: 'First Name',
    description: 'Given name of the contact',
    placeholder: 'John',
    acceptsVariables: true,
  }),
  createFamilyName: Workflow.string({
    label: 'Last Name',
    description: 'Family name of the contact',
    placeholder: 'Doe',
    acceptsVariables: true,
  }),
  createMiddleName: Workflow.string({
    label: 'Middle Name',
    acceptsVariables: true,
  }),
  createHonorificPrefix: Workflow.string({
    label: 'Honorific Prefix',
    description: 'e.g. Mr., Mrs., Dr.',
    acceptsVariables: true,
  }),
  createHonorificSuffix: Workflow.string({
    label: 'Honorific Suffix',
    description: 'e.g. Jr., Sr., III',
    acceptsVariables: true,
  }),
  createEmail: Workflow.string({
    label: 'Email',
    placeholder: 'john@example.com',
    acceptsVariables: true,
  }),
  createEmailType: Workflow.select({
    label: 'Email Type',
    options: [
      { value: 'home', label: 'Home' },
      { value: 'work', label: 'Work' },
      { value: 'other', label: 'Other' },
    ],
    default: 'home',
  }),
  createPhone: Workflow.string({
    label: 'Phone',
    placeholder: '+1234567890',
    acceptsVariables: true,
  }),
  createPhoneType: Workflow.select({
    label: 'Phone Type',
    options: [
      { value: 'mobile', label: 'Mobile' },
      { value: 'home', label: 'Home' },
      { value: 'work', label: 'Work' },
      { value: 'main', label: 'Main' },
      { value: 'homeFax', label: 'Home Fax' },
      { value: 'workFax', label: 'Work Fax' },
      { value: 'pager', label: 'Pager' },
      { value: 'other', label: 'Other' },
    ],
    default: 'mobile',
  }),
  createCompany: Workflow.string({
    label: 'Company',
    acceptsVariables: true,
  }),
  createJobTitle: Workflow.string({
    label: 'Job Title',
    acceptsVariables: true,
  }),
  createNotes: Workflow.string({
    label: 'Notes',
    acceptsVariables: true,
  }),
  createBirthday: Workflow.string({
    label: 'Birthday',
    description: 'Date in YYYY-MM-DD format',
    placeholder: '1990-01-15',
    acceptsVariables: true,
  }),
  createStreetAddress: Workflow.string({
    label: 'Street Address',
    acceptsVariables: true,
  }),
  createCity: Workflow.string({
    label: 'City',
    acceptsVariables: true,
  }),
  createRegion: Workflow.string({
    label: 'State/Region',
    acceptsVariables: true,
  }),
  createPostalCode: Workflow.string({
    label: 'Postal Code',
    acceptsVariables: true,
  }),
  createCountryCode: Workflow.string({
    label: 'Country Code',
    description: 'ISO 3166-1 alpha-2 code (e.g. US, GB)',
    acceptsVariables: true,
  }),
  createAddressType: Workflow.select({
    label: 'Address Type',
    options: [
      { value: 'home', label: 'Home' },
      { value: 'work', label: 'Work' },
      { value: 'other', label: 'Other' },
    ],
    default: 'home',
  }),
  createGroup: Workflow.select({
    label: 'Group',
    description: 'Contact group to add the contact to',
    options: [] as { value: string; label: string }[],
  }),

  // --- Contact: Delete ---
  deleteContactId: Workflow.string({
    label: 'Contact ID',
    description: 'The resource name of the contact (e.g. people/c12345)',
    acceptsVariables: true,
  }),

  // --- Contact: Get ---
  getContactId: Workflow.string({
    label: 'Contact ID',
    description: 'The resource name of the contact (e.g. people/c12345)',
    acceptsVariables: true,
  }),
  getFields: Workflow.select({
    label: 'Fields',
    description: 'Which fields to return',
    options: [
      { value: '*', label: 'All Fields' },
      { value: 'names', label: 'Names' },
      { value: 'emailAddresses', label: 'Email Addresses' },
      { value: 'phoneNumbers', label: 'Phone Numbers' },
      { value: 'organizations', label: 'Organizations' },
      { value: 'addresses', label: 'Addresses' },
      { value: 'birthdays', label: 'Birthdays' },
      { value: 'biographies', label: 'Notes' },
      { value: 'photos', label: 'Photos' },
      { value: 'memberships', label: 'Groups' },
      { value: 'relations', label: 'Relations' },
      { value: 'events', label: 'Events' },
      { value: 'urls', label: 'URLs' },
      { value: 'userDefined', label: 'Custom Fields' },
      { value: 'metadata', label: 'Metadata' },
    ],
    default: '*',
  }),

  // --- Contact: Get Many ---
  getManyUseQuery: Workflow.select({
    label: 'Mode',
    description: 'List all contacts or search by query',
    options: [
      { value: 'false', label: 'List All' },
      { value: 'true', label: 'Search' },
    ],
    default: 'false',
  }),
  getManyQuery: Workflow.string({
    label: 'Search Query',
    description: 'Prefix search across contact fields (e.g. "John", "acme")',
    placeholder: 'John',
    acceptsVariables: true,
  }),
  getManyFields: Workflow.select({
    label: 'Fields',
    description: 'Which fields to return',
    options: [
      { value: '*', label: 'All Fields' },
      { value: 'names', label: 'Names' },
      { value: 'emailAddresses', label: 'Email Addresses' },
      { value: 'phoneNumbers', label: 'Phone Numbers' },
      { value: 'organizations', label: 'Organizations' },
      { value: 'addresses', label: 'Addresses' },
      { value: 'birthdays', label: 'Birthdays' },
      { value: 'biographies', label: 'Notes' },
      { value: 'photos', label: 'Photos' },
      { value: 'memberships', label: 'Groups' },
      { value: 'metadata', label: 'Metadata' },
    ],
    default: '*',
  }),
  getManyLimit: Workflow.select({
    label: 'Limit',
    description: 'Maximum number of contacts to return',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
      { value: '500', label: '500' },
    ],
    default: '100',
  }),
  getManySortOrder: Workflow.select({
    label: 'Sort Order',
    options: [
      { value: '', label: 'Default' },
      { value: 'LAST_MODIFIED_ASCENDING', label: 'Last Modified (Oldest First)' },
      { value: 'LAST_MODIFIED_DESCENDING', label: 'Last Modified (Newest First)' },
      { value: 'FIRST_NAME_ASCENDING', label: 'First Name (A-Z)' },
      { value: 'LAST_NAME_ASCENDING', label: 'Last Name (A-Z)' },
    ],
    default: '',
  }),

  // --- Contact: Update ---
  updateContactId: Workflow.string({
    label: 'Contact ID',
    description: 'The resource name of the contact (e.g. people/c12345)',
    acceptsVariables: true,
  }),
  updateGivenName: Workflow.string({
    label: 'First Name',
    acceptsVariables: true,
  }),
  updateFamilyName: Workflow.string({
    label: 'Last Name',
    acceptsVariables: true,
  }),
  updateMiddleName: Workflow.string({
    label: 'Middle Name',
    acceptsVariables: true,
  }),
  updateHonorificPrefix: Workflow.string({
    label: 'Honorific Prefix',
    acceptsVariables: true,
  }),
  updateHonorificSuffix: Workflow.string({
    label: 'Honorific Suffix',
    acceptsVariables: true,
  }),
  updateEmail: Workflow.string({
    label: 'Email',
    acceptsVariables: true,
  }),
  updateEmailType: Workflow.select({
    label: 'Email Type',
    options: [
      { value: 'home', label: 'Home' },
      { value: 'work', label: 'Work' },
      { value: 'other', label: 'Other' },
    ],
    default: 'home',
  }),
  updatePhone: Workflow.string({
    label: 'Phone',
    acceptsVariables: true,
  }),
  updatePhoneType: Workflow.select({
    label: 'Phone Type',
    options: [
      { value: 'mobile', label: 'Mobile' },
      { value: 'home', label: 'Home' },
      { value: 'work', label: 'Work' },
      { value: 'main', label: 'Main' },
      { value: 'homeFax', label: 'Home Fax' },
      { value: 'workFax', label: 'Work Fax' },
      { value: 'pager', label: 'Pager' },
      { value: 'other', label: 'Other' },
    ],
    default: 'mobile',
  }),
  updateCompany: Workflow.string({
    label: 'Company',
    acceptsVariables: true,
  }),
  updateJobTitle: Workflow.string({
    label: 'Job Title',
    acceptsVariables: true,
  }),
  updateNotes: Workflow.string({
    label: 'Notes',
    acceptsVariables: true,
  }),
  updateBirthday: Workflow.string({
    label: 'Birthday',
    description: 'Date in YYYY-MM-DD format',
    acceptsVariables: true,
  }),
  updateStreetAddress: Workflow.string({
    label: 'Street Address',
    acceptsVariables: true,
  }),
  updateCity: Workflow.string({
    label: 'City',
    acceptsVariables: true,
  }),
  updateRegion: Workflow.string({
    label: 'State/Region',
    acceptsVariables: true,
  }),
  updatePostalCode: Workflow.string({
    label: 'Postal Code',
    acceptsVariables: true,
  }),
  updateCountryCode: Workflow.string({
    label: 'Country Code',
    acceptsVariables: true,
  }),
  updateAddressType: Workflow.select({
    label: 'Address Type',
    options: [
      { value: 'home', label: 'Home' },
      { value: 'work', label: 'Work' },
      { value: 'other', label: 'Other' },
    ],
    default: 'home',
  }),
  updateGroup: Workflow.select({
    label: 'Group',
    description: 'Contact group to assign',
    options: [] as { value: string; label: string }[],
  }),
}

export function contactComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
      contactId: Workflow.string({ label: 'Contact ID' }),
      resourceName: Workflow.string({ label: 'Resource Name' }),
      givenName: Workflow.string({ label: 'First Name' }),
      familyName: Workflow.string({ label: 'Last Name' }),
      displayName: Workflow.string({ label: 'Display Name' }),
      email: Workflow.string({ label: 'Email' }),
      phone: Workflow.string({ label: 'Phone' }),
      company: Workflow.string({ label: 'Company' }),
      jobTitle: Workflow.string({ label: 'Job Title' }),
      notes: Workflow.string({ label: 'Notes' }),
    }
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      contacts: Workflow.array({
        label: 'Contacts',
        items: Workflow.struct(
          {
            contactId: Workflow.string({ label: 'Contact ID' }),
            resourceName: Workflow.string({ label: 'Resource Name' }),
            givenName: Workflow.string({ label: 'First Name' }),
            familyName: Workflow.string({ label: 'Last Name' }),
            displayName: Workflow.string({ label: 'Display Name' }),
            email: Workflow.string({ label: 'Email' }),
            phone: Workflow.string({ label: 'Phone' }),
            company: Workflow.string({ label: 'Company' }),
            jobTitle: Workflow.string({ label: 'Job Title' }),
            notes: Workflow.string({ label: 'Notes' }),
          },
          { label: 'Contact' }
        ),
      }),
      count: Workflow.number({ label: 'Count' }),
    }
  }
  return {}
}
