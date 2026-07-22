// src/tools/create-quickbooks-item.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksItemExecute from './create-quickbooks-item.tool.server'

export const createQuickbooksItemTool = defineTool({
  id: 'create_quickbooks_item',
  name: 'Create QuickBooks item',
  description:
    'Create a new QuickBooks Service item (product/service catalog). Use list_quickbooks_accounts to resolve incomeAccountId first.',
  icon: quickbooksIcon,
  inputs: z.object({
    name: z.string().describe('Required; item name shown on invoices and estimates.'),
    incomeAccountId: z
      .string()
      .describe('QuickBooks Income AccountRef.Id. Resolve via list_quickbooks_accounts.'),
    description: z.string().optional().describe('Line-item description shown on documents.'),
    unitPrice: z.number().optional().describe('Default unit price.'),
    taxable: z.boolean().optional(),
  }),
  outputs: z.object({
    itemId: z.string(),
    name: z.string(),
    type: z.enum(['Inventory', 'Service', 'NonInventory', 'Group']),
    unitPrice: z.number().nullable(),
    description: z.string().nullable(),
    active: z.boolean(),
    qtyOnHand: z.number().nullable().describe('Inventory items only.'),
    syncToken: z.string(),
  }),
  exampleOutput: {
    itemId: '61',
    name: 'Pest Control - Quarterly Service',
    type: 'Service',
    unitPrice: 129,
    description: null,
    active: true,
    qtyOnHand: null,
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createQuickbooksItemExecute,
  agent: { toolsetSlug: 'quickbooks.sales.write' },
})
