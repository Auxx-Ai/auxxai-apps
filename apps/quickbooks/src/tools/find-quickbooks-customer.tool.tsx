// src/tools/find-quickbooks-customer.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksCustomerExecute from './find-quickbooks-customer.tool.server'

export const findQuickbooksCustomerTool = defineTool({
  id: 'find_quickbooks_customer',
  name: 'Find QuickBooks customer',
  description:
    'Look up a QuickBooks customer by exact email or by display name. Returns the customer plus Auxx contact / company recordIds when imported.',
  icon: quickbooksIcon,
  inputs: z
    .object({
      email: z
        .string()
        .email()
        .optional()
        .describe('Customer primary email. Provide email OR displayName.'),
      displayName: z
        .string()
        .optional()
        .describe('Customer DisplayName (exact match). Provide email OR displayName.'),
    })
    .refine((v) => (v.email ? 1 : 0) + (v.displayName ? 1 : 0) === 1, {
      message: 'Provide exactly one of email or displayName.',
    }),
  outputs: z.object({
    found: z.boolean(),
    customer: z
      .object({
        customerId: z.string(),
        displayName: z.string(),
        givenName: z.string().nullable(),
        familyName: z.string().nullable(),
        companyName: z.string().nullable(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        balance: z.number().describe('Open balance in the company currency.'),
        active: z.boolean(),
        syncToken: z.string().describe('Required for follow-up update_quickbooks_customer calls.'),
        auxxContactId: refs
          .entity('contact')
          .nullable()
          .describe(
            'Auxx contact recordId if this QB customer has been imported. Use in `auxx:entity-card` fences.'
          ),
        auxxCompanyId: refs
          .entity('company')
          .nullable()
          .describe(
            'Auxx company recordId if CompanyName is populated and imported. null otherwise.'
          ),
      })
      .nullable(),
    notImportedReason: z
      .enum(['NOT_IMPORTED'])
      .nullable()
      .describe(
        'Set when the customer exists in QB but at least one expected Auxx ref is missing.'
      ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findQuickbooksCustomerExecute,
})
