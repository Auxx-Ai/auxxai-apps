// src/tools/resolve-quickbooks-account.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import resolveQuickbooksAccountExecute from './resolve-quickbooks-account.tool.server'

export const resolveQuickbooksAccountTool = defineTool({
  id: 'resolve_quickbooks_account',
  name: 'Resolve QuickBooks account',
  description:
    'Resolve a single account NUMBER ("1200") or NAME ("Shopify Clearing") to its QuickBooks account id. Use when posting a journal entry: the API takes an account id, but a chart of accounts is written in numbers and names. Refuses ambiguous matches rather than guessing. Use list_quickbooks_accounts instead when browsing or when the exact wording is unknown.',
  icon: quickbooksIcon,
  inputs: z.object({
    query: z
      .string()
      .describe(
        'An account number ("1200"), a name ("Shopify Clearing"), or a fully qualified name ("Income:Sales:Consulting"). Case- and whitespace-insensitive.'
      ),
    includeInactive: z
      .boolean()
      .optional()
      .describe(
        'Also search inactive accounts. Defaults to false — an inactive account cannot be posted to.'
      ),
  }),
  outputs: z.object({
    account: z.object({
      id: z.string().describe('QuickBooks AccountRef id. Use directly in a journal entry line.'),
      name: z.string(),
      fullyQualifiedName: z.string(),
      acctNum: z.string().nullable(),
      accountType: z.string(),
      classification: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
      active: z.boolean(),
    }),
    matchedOn: z
      .enum(['acctNum', 'fullyQualifiedName', 'name'])
      .describe('Which key matched. Number is tried first when the company uses account numbers.'),
  }),
  exampleOutput: {
    account: {
      id: '92',
      name: 'Shopify Clearing',
      fullyQualifiedName: 'Shopify Clearing',
      acctNum: '1200',
      accountType: 'Other Current Asset',
      classification: 'Asset',
      active: true,
    },
    matchedOn: 'acctNum',
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: resolveQuickbooksAccountExecute,
  agent: {},
})
