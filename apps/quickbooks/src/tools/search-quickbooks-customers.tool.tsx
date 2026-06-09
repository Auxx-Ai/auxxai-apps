// src/tools/search-quickbooks-customers.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import searchQuickbooksCustomersExecute from './search-quickbooks-customers.tool.server'

export const searchQuickbooksCustomersTool = defineTool({
  id: 'search_quickbooks_customers',
  name: 'Search QuickBooks customers',
  description:
    'Search QuickBooks customers by substring match on DisplayName. Use when the LLM has a partial name and needs to narrow down to a specific customer.',
  icon: quickbooksIcon,
  inputs: z.object({
    query: z
      .string()
      .optional()
      .describe('Substring match on DisplayName. Omit to list recent active customers.'),
    activeOnly: z.boolean().default(true).describe('Only include active customers.'),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  outputs: z.object({
    customers: z.array(
      z.object({
        customerId: z.string(),
        displayName: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        companyName: z.string().nullable(),
        balance: z.number(),
        active: z.boolean(),
        auxxContactId: refs.entity('contact').nullable(),
        auxxCompanyId: refs.entity('company').nullable(),
      })
    ),
    hasMore: z.boolean(),
  }),
  exampleOutput: {
    customers: [
      {
        customerId: '58',
        displayName: 'Acme Corp',
        email: 'jane@acmecorp.com',
        phone: '+1 415-555-0188',
        companyName: 'Acme Corp',
        balance: 1240.5,
        active: true,
        auxxContactId: null,
        auxxCompanyId: null,
      },
      {
        customerId: '62',
        displayName: 'Acme Holdings',
        email: 'ap@acmeholdings.com',
        phone: null,
        companyName: 'Acme Holdings',
        balance: 0,
        active: true,
        auxxContactId: null,
        auxxCompanyId: null,
      },
    ],
    hasMore: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchQuickbooksCustomersExecute,
  agent: { toolsetSlug: 'quickbooks.contacts.read' },
})
