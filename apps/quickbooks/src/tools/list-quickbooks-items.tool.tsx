// src/tools/list-quickbooks-items.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import listQuickbooksItemsExecute from './list-quickbooks-items.tool.server'

export const listQuickbooksItemsTool = defineTool({
  id: 'list_quickbooks_items',
  name: 'List QuickBooks items',
  description:
    'List the product/service catalog on the connected QuickBooks company. Use before create_quickbooks_invoice or create_quickbooks_estimate to resolve a human item name to the id the API expects.',
  icon: quickbooksIcon,
  inputs: z.object({}),
  outputs: z.object({
    items: z.array(
      z.object({
        id: z.string().describe('Use as itemId in create_quickbooks_invoice line items.'),
        name: z.string(),
        type: z.enum(['Inventory', 'Service', 'NonInventory', 'Group']),
        unitPrice: z.number().nullable(),
        description: z.string().nullable(),
        active: z.boolean(),
      })
    ),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: listQuickbooksItemsExecute,
})
