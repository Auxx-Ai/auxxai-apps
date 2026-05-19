// src/tools/get-quickbooks-item.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksItemExecute from './get-quickbooks-item.tool.server'

export const getQuickbooksItemTool = defineTool({
  id: 'get_quickbooks_item',
  name: 'Get QuickBooks item',
  description:
    'Fetch a QuickBooks product or service item by id when list_quickbooks_items is not enough.',
  icon: quickbooksIcon,
  inputs: z.object({
    itemId: z.string().describe('QuickBooks Item.Id.'),
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
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getQuickbooksItemExecute,
})
