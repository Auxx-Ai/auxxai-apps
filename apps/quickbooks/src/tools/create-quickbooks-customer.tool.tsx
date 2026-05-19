// src/tools/create-quickbooks-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksCustomerExecute from './create-quickbooks-customer.tool.server'

export const createQuickbooksCustomerTool = defineTool({
  id: 'create_quickbooks_customer',
  name: 'Create QuickBooks customer',
  description:
    'Create a new QuickBooks customer. displayName must be unique in the realm — duplicates fail with code 6240.',
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
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createQuickbooksCustomerExecute,
})
