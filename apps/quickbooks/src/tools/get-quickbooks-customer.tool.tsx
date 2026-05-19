// src/tools/get-quickbooks-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksCustomerExecute from './get-quickbooks-customer.tool.server'

export const getQuickbooksCustomerTool = defineTool({
  id: 'get_quickbooks_customer',
  name: 'Get QuickBooks customer',
  description:
    'Fetch a QuickBooks customer by its internal id. Returns full detail plus Auxx contact / company refs.',
  icon: quickbooksIcon,
  inputs: z.object({
    customerId: z.string().describe('QuickBooks Customer.Id (numeric string).'),
  }),
  outputs: z.object({
    customerId: z.string(),
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
    taxable: z.boolean().nullable(),
    preferredDeliveryMethod: z.string().nullable(),
    syncToken: z.string().describe('Required for follow-up update_quickbooks_customer calls.'),
    auxxContactId: refs.entity('contact').nullable(),
    auxxCompanyId: refs.entity('company').nullable(),
    notImportedReason: z.enum(['NOT_IMPORTED']).nullable(),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksCustomerExecute,
})
