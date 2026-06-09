// src/tools/update-quickbooks-vendor.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import updateQuickbooksVendorExecute from './update-quickbooks-vendor.tool.server'

export const updateQuickbooksVendorTool = defineTool({
  id: 'update_quickbooks_vendor',
  name: 'Update QuickBooks vendor',
  description:
    'Update fields on an existing QuickBooks vendor. Sparse — only the fields you pass are changed.',
  icon: quickbooksIcon,
  inputs: z.object({
    vendorId: z.string().describe('QuickBooks Vendor.Id to update.'),
    displayName: z.string().optional(),
    givenName: z.string().optional(),
    familyName: z.string().optional(),
    companyName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    billingAddress: z
      .object({
        line1: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        state: z.string().optional(),
      })
      .optional(),
    acctNum: z.string().optional(),
    vendor1099: z.boolean().optional(),
  }),
  outputs: z.object({
    vendorId: z.string(),
    displayName: z.string(),
    syncToken: z.string(),
    auxxCompanyId: refs.entity('company').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  exampleOutput: {
    vendorId: '74',
    displayName: 'Pacific Office Supplies',
    syncToken: '3',
    auxxCompanyId: null,
    notImportedReason: null,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: updateQuickbooksVendorExecute,
  agent: { toolsetSlug: 'quickbooks.contacts.write' },
})
