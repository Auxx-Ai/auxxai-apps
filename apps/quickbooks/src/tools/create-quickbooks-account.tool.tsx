// src/tools/create-quickbooks-account.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksAccountExecute from './create-quickbooks-account.tool.server'

const accountShape = z.object({
  id: z.string().describe('QuickBooks AccountRef id. Use directly in a journal entry line.'),
  name: z.string(),
  fullyQualifiedName: z.string(),
  acctNum: z
    .string()
    .nullable()
    .describe('Null when the company has account numbers turned off — see acctNumDropped.'),
  accountType: z.string(),
  accountSubType: z
    .string()
    .nullable()
    .describe("QuickBooks' detail type, e.g. 'OtherCurrentAssets'."),
  classification: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
  active: z.boolean(),
})

/**
 * Platform-called, not a chat-agent tool: no `agent` key, so it never appears
 * in an agent's tool list and is not reachable through a toolset. The caller is
 * the accounts screen's per-row "create and link", which is an explicit act by
 * a person holding `ledgerControl` — adding accounts to a company's chart is
 * not something a conversation should be able to do in passing. Same posture as
 * get_quickbooks_balance_sheet and get_quickbooks_general_ledger.
 */
export const createQuickbooksAccountTool = defineTool({
  id: 'create_quickbooks_account',
  name: 'Create QuickBooks account',
  description:
    "Create one account in the connected company's chart of accounts, for an account auxx keeps that QuickBooks has no counterpart for. Looks for an existing account by number then name first and returns that instead of creating a duplicate.",
  icon: quickbooksIcon,
  inputs: z.object({
    name: z.string().describe('Required; the account name as it will read in the chart.'),
    acctNum: z
      .string()
      .optional()
      .describe(
        'The account NUMBER ("1200"). Stored only when the company has account numbers enabled; otherwise QuickBooks drops it silently and acctNumDropped comes back true.'
      ),
    accountType: z
      .string()
      .optional()
      .describe(
        "QuickBooks' AccountType, e.g. 'Other Current Asset', 'Bank', 'Income'. Required unless accountSubType is given."
      ),
    accountSubType: z
      .string()
      .optional()
      .describe(
        "QuickBooks' detail type, e.g. 'OtherCurrentAssets', 'Checking'. Given alone, Intuit infers accountType from it."
      ),
    description: z.string().optional(),
    reuseExisting: z
      .boolean()
      .optional()
      .describe(
        'Return a matching existing account instead of creating one. Defaults to true; false genuinely creates a second account.'
      ),
  }),
  outputs: z.object({
    account: accountShape,
    outcome: z
      .enum(['created', 'existing'])
      .describe('`existing` means nothing was written — an account already matched.'),
    matchedOn: z.enum(['acctNum', 'name']).nullable().describe('Null on a create.'),
    acctNumDropped: z
      .boolean()
      .describe(
        'True when acctNum was asked for and QuickBooks stored no number — the company has account numbers turned off.'
      ),
  }),
  exampleOutput: {
    account: {
      id: '104',
      name: 'Card Clearing',
      fullyQualifiedName: 'Card Clearing',
      acctNum: '1200',
      accountType: 'Other Current Asset',
      accountSubType: 'OtherCurrentAssets',
      classification: 'Asset',
      active: true,
    },
    outcome: 'created',
    matchedOn: null,
    acctNumDropped: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createQuickbooksAccountExecute,
})
