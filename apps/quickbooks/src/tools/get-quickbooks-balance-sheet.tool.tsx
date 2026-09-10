// src/tools/get-quickbooks-balance-sheet.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksBalanceSheetExecute from './get-quickbooks-balance-sheet.tool.server'

/**
 * Fetches the QuickBooks BalanceSheet report as of a date (Accrual
 * accounting) and returns it mapped to flat, signed, debit-positive rows.
 * This is a platform-called tool for the opening-balance suggestion flow -
 * it is not meant for chat agents (no `agent` key, see the comment in
 * `toolsets.ts`).
 */
export const getQuickbooksBalanceSheetTool = defineTool({
  id: 'get_quickbooks_balance_sheet',
  name: 'Get QuickBooks balance sheet',
  description:
    'Fetch the QuickBooks BalanceSheet report as of a given date (Accrual accounting) and return it mapped to flat, signed, debit-positive rows keyed by QuickBooks account id. Used by the platform opening-balance suggestion flow - it is not meant for chat agents.',
  icon: quickbooksIcon,
  inputs: z.object({
    asOf: z.string().describe('YYYY-MM-DD, the as-of date'),
    accountingMethod: z.enum(['Accrual', 'Cash']).optional().describe('Defaults to Accrual'),
  }),
  outputs: z.object({
    asOf: z.string().describe('Header.EndPeriod, asserted equal to the requested asOf date.'),
    currency: z.string().describe('The company\'s home currency, e.g. "USD".'),
    reportBasis: z
      .string()
      .describe(
        'Header.ReportBasis. Always "Accrual" from this tool; carried so a reader can check.'
      ),
    hasData: z
      .boolean()
      .describe(
        'False means the company has no data as of this date - the empty-import case a caller must refuse on.'
      ),
    rows: z.array(
      z.object({
        providerAccountId: z
          .string()
          .nullable()
          .describe('QuickBooks Account.Id. Null only for the computed net_income row.'),
        name: z
          .string()
          .describe('As rendered on the report. Not used to join - the id is the join key.'),
        kind: z
          .enum(['account', 'net_income'])
          .describe('"net_income" is the one computed row with no account behind it.'),
        minorSigned: z
          .number()
          .int()
          .describe(
            'Integer minor units, DEBIT-POSITIVE regardless of which side of the report it came from.'
          ),
      })
    ),
  }),
  exampleOutput: {
    asOf: '2025-12-31',
    currency: 'USD',
    reportBasis: 'Accrual',
    hasData: true,
    rows: [
      { providerAccountId: '35', name: 'Checking', kind: 'account', minorSigned: 120100 },
      {
        providerAccountId: '33',
        name: 'Accounts Payable (A/P)',
        kind: 'account',
        minorSigned: -160267,
      },
      {
        providerAccountId: '34',
        name: 'Opening Balance Equity',
        kind: 'account',
        minorSigned: 933750,
      },
      { providerAccountId: '2', name: 'Retained Earnings', kind: 'account', minorSigned: -173885 },
      { providerAccountId: null, name: 'Net Income', kind: 'net_income', minorSigned: 9639 },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: getQuickbooksBalanceSheetExecute,
  // No `agent` and no `action` key, like the internal tools below it in
  // app.tsx: the platform invokes it by id through the Lambda tool executor,
  // and it is never offered to an LLM or rendered as a button.
})
