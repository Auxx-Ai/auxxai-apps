// src/tools/update-quickbooks-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import updateQuickbooksCustomerExecute from './update-quickbooks-customer.tool.server'

export const updateQuickbooksCustomerTool = defineTool({
  id: 'update_quickbooks_customer',
  name: 'Update QuickBooks customer',
  description:
    'Update fields on an existing QuickBooks customer. Only the fields you pass are changed (sparse update). SyncToken is fetched server-side — do not pass it.',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z.string().describe('QuickBooks Customer.Id to update.'),
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
    taxable: z.boolean().optional(),
  }),
  outputs: z.object({
    customerId: z.string(),
    displayName: z.string(),
    syncToken: z.string(),
    auxxContactId: refs.entity('contact').nullable(),
    auxxCompanyId: refs.entity('company').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  exampleOutput: {
    customerId: '58',
    displayName: 'Acme Corp',
    syncToken: '4',
    auxxContactId: null,
    auxxCompanyId: null,
    notImportedReason: null,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: updateQuickbooksCustomerExecute,
  agent: { toolsetSlug: 'quickbooks.contacts.write' },
})
