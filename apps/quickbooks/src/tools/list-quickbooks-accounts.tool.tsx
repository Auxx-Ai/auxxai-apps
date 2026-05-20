// src/tools/list-quickbooks-accounts.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import listQuickbooksAccountsExecute from './list-quickbooks-accounts.tool.server'

export const listQuickbooksAccountsTool = defineTool({
  id: 'list_quickbooks_accounts',
  name: 'List QuickBooks accounts',
  description:
    'List the chart of accounts (assets, liabilities, income, expenses) on the connected QuickBooks company. Use before create_quickbooks_invoice or update_quickbooks_invoice when the caller needs to assign an account to a line — the API takes an account id, not a human name.',
  icon: quickbooksIcon,
  inputs: z.object({}),
  outputs: z.object({
    accounts: z.array(
      z.object({
        id: z.string().describe('QuickBooks AccountRef id. Use directly in create/update calls.'),
        name: z.string(),
        fullyQualifiedName: z
          .string()
          .describe('e.g. "Income:Sales:Consulting" — disambiguates duplicate leaf names.'),
        accountType: z.string().describe('Income, Expense, Bank, Accounts Receivable, etc.'),
        classification: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
        active: z.boolean(),
      })
    ),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: listQuickbooksAccountsExecute,
  agent: {},
})
