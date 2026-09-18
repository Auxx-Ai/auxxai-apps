// src/tools/find-quickbooks-item.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksItemExecute from './find-quickbooks-item.tool.server'

/** Platform-called, not a chat-agent tool: no `agent` key — the export pipeline is the only caller. */
export const findQuickbooksItemTool = defineTool({
  id: 'find_quickbooks_item',
  name: 'Find QuickBooks item',
  description:
    'Look up a QuickBooks item by exact name. Use before create_quickbooks_item so the generic Service item for an income account is reused rather than duplicated.',
  icon: quickbooksIcon,
  inputs: z.object({
    name: z.string().min(1).describe('Exact item name.'),
  }),
  outputs: z.union([
    z.object({
      status: z.literal('Found'),
      itemId: z.string(),
      name: z.string(),
      incomeAccountId: z.string().nullable(),
      syncToken: z.string(),
    }),
    z.object({ status: z.literal('NotFound') }),
  ]),
  exampleOutput: {
    status: 'Found',
    itemId: '61',
    name: 'auxx:79',
    incomeAccountId: '79',
    syncToken: '0',
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findQuickbooksItemExecute,
})
