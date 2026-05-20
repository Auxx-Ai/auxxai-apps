// src/tools/find-quickbooks-vendor.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksVendorExecute from './find-quickbooks-vendor.tool.server'

export const findQuickbooksVendorTool = defineTool({
  id: 'find_quickbooks_vendor',
  name: 'Find QuickBooks vendor',
  description:
    'Look up a QuickBooks vendor by exact email or by display name. Returns the vendor plus the Auxx company recordId when imported.',
  icon: quickbooksIcon,
  inputs: z
    .object({
      email: z
        .string()
        .email()
        .optional()
        .describe('Vendor primary email. Provide email OR displayName.'),
      displayName: z
        .string()
        .optional()
        .describe('Vendor DisplayName (exact match). Provide email OR displayName.'),
    })
    .refine((v) => (v.email ? 1 : 0) + (v.displayName ? 1 : 0) === 1, {
      message: 'Provide exactly one of email or displayName.',
    }),
  outputs: z.object({
    found: z.boolean(),
    vendor: z
      .object({
        vendorId: z.string(),
        displayName: z.string(),
        givenName: z.string().nullable(),
        familyName: z.string().nullable(),
        companyName: z.string().nullable(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        balance: z.number(),
        active: z.boolean(),
        acctNum: z.string().nullable(),
        vendor1099: z.boolean().nullable(),
        syncToken: z.string(),
        auxxCompanyId: refs.entity('company').nullable(),
      })
      .nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findQuickbooksVendorExecute,
  agent: { toolsetSlug: 'quickbooks.contacts.read' },
})
