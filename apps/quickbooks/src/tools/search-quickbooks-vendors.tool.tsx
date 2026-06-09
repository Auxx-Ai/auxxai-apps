// src/tools/search-quickbooks-vendors.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import searchQuickbooksVendorsExecute from './search-quickbooks-vendors.tool.server'

export const searchQuickbooksVendorsTool = defineTool({
  id: 'search_quickbooks_vendors',
  name: 'Search QuickBooks vendors',
  description: 'Search QuickBooks vendors by substring match on DisplayName.',
  icon: quickbooksIcon,
  inputs: z.object({
    query: z.string().optional().describe('Substring match on DisplayName.'),
    activeOnly: z.boolean().default(true),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  outputs: z.object({
    vendors: z.array(
      z.object({
        vendorId: z.string(),
        displayName: z.string(),
        email: z.string().nullable(),
        phone: z.string().nullable(),
        companyName: z.string().nullable(),
        balance: z.number(),
        active: z.boolean(),
        auxxCompanyId: refs.entity('company').nullable(),
      })
    ),
    hasMore: z.boolean(),
  }),
  exampleOutput: {
    vendors: [
      {
        vendorId: '74',
        displayName: 'Pacific Office Supplies',
        email: 'billing@pacificoffice.com',
        phone: '+1 206-555-0142',
        companyName: 'Pacific Office Supplies',
        balance: 320,
        active: true,
        auxxCompanyId: null,
      },
      {
        vendorId: '75',
        displayName: 'Pacific Freight Co',
        email: null,
        phone: null,
        companyName: 'Pacific Freight Co',
        balance: 0,
        active: true,
        auxxCompanyId: null,
      },
    ],
    hasMore: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchQuickbooksVendorsExecute,
  agent: { toolsetSlug: 'quickbooks.contacts.read' },
})
