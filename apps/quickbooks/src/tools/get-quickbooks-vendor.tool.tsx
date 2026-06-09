// src/tools/get-quickbooks-vendor.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksVendorExecute from './get-quickbooks-vendor.tool.server'

export const getQuickbooksVendorTool = defineTool({
  id: 'get_quickbooks_vendor',
  name: 'Get QuickBooks vendor',
  description:
    'Fetch a QuickBooks vendor by its internal id. Returns full detail plus Auxx company ref.',
  icon: quickbooksIcon,
  inputs: z.object({
    vendorId: z.string().describe('QuickBooks Vendor.Id (numeric string).'),
  }),
  outputs: z.object({
    vendorId: z.string(),
    displayName: z.string(),
    givenName: z.string().nullable(),
    familyName: z.string().nullable(),
    companyName: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    billingAddress: z
      .object({
        line1: z.string().nullable(),
        city: z.string().nullable(),
        postalCode: z.string().nullable(),
        state: z.string().nullable(),
      })
      .nullable(),
    balance: z.number(),
    active: z.boolean(),
    acctNum: z.string().nullable(),
    vendor1099: z.boolean().nullable(),
    syncToken: z.string(),
    auxxCompanyId: refs.entity('company').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  exampleOutput: {
    vendorId: '74',
    displayName: 'Pacific Office Supplies',
    givenName: null,
    familyName: null,
    companyName: 'Pacific Office Supplies',
    email: 'billing@pacificoffice.com',
    phone: '+1 206-555-0142',
    billingAddress: {
      line1: '1200 Western Ave',
      city: 'Seattle',
      postalCode: '98101',
      state: 'WA',
    },
    balance: 320,
    active: true,
    acctNum: 'PO-4471',
    vendor1099: false,
    syncToken: '2',
    auxxCompanyId: null,
    notImportedReason: null,
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksVendorExecute,
  agent: { toolsetSlug: 'quickbooks.contacts.read' },
})
