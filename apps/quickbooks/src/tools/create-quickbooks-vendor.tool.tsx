// src/tools/create-quickbooks-vendor.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksVendorExecute from './create-quickbooks-vendor.tool.server'

export const createQuickbooksVendorTool = defineTool({
  id: 'create_quickbooks_vendor',
  name: 'Create QuickBooks vendor',
  description: 'Create a new QuickBooks vendor. displayName must be unique in the realm.',
  icon: quickbooksIcon,
  inputs: z.object({
    displayName: z.string().describe('Required; must be unique in the realm.'),
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
    acctNum: z.string().optional().describe('Vendor account number.'),
    vendor1099: z.boolean().optional().describe('Mark as 1099 contractor.'),
  }),
  outputs: z.object({
    vendorId: z.string(),
    displayName: z.string(),
    syncToken: z.string(),
    auxxCompanyId: refs.entity('company').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createQuickbooksVendorExecute,
})
