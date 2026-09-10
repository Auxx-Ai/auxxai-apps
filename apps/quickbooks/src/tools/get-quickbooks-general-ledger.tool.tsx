// src/tools/get-quickbooks-general-ledger.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import getQuickbooksGeneralLedgerExecute from './get-quickbooks-general-ledger.tool.server'

/**
 * Fetches the QuickBooks GeneralLedger report for a date range and returns it
 * as flat lines with an explicit debit and credit per line. This is a
 * platform-called tool for the inbound half of the ledger sync - it is not
 * meant for chat agents (no `agent` key, see the comment in `toolsets.ts`).
 *
 * 🛑 **One line is one journal LINE, not one entry.** Group by
 * `(txnType, txnId)` to reconstruct an entry; the 2026-09-10 sandbox fixture is
 * 337 rows and 128 transactions, all of which balance once grouped.
 */
export const getQuickbooksGeneralLedgerTool = defineTool({
  id: 'get_quickbooks_general_ledger',
  name: 'Get QuickBooks general ledger',
  description:
    'Fetch the QuickBooks GeneralLedger report for a date range (Accrual accounting) and return it as flat lines keyed by QuickBooks account id, with an explicit debit and credit per line and the source transaction type and id. One line is one journal line, not one entry. Used by the platform ledger sync - it is not meant for chat agents.',
  icon: quickbooksIcon,
  inputs: z.object({
    from: z.string().describe('YYYY-MM-DD, the first day of the range (inclusive)'),
    to: z.string().describe('YYYY-MM-DD, the last day of the range (inclusive)'),
    accountingMethod: z.enum(['Accrual', 'Cash']).optional().describe('Defaults to Accrual'),
  }),
  outputs: z.object({
    from: z.string().describe('Header.StartPeriod, asserted equal to the requested from date.'),
    to: z.string().describe('Header.EndPeriod, asserted equal to the requested to date.'),
    currency: z.string().describe('The company\'s home currency, e.g. "USD".'),
    hasData: z
      .boolean()
      .describe('False means the company has no data in this range - Header.Option[NoReportData].'),
    lines: z.array(
      z.object({
        txnType: z
          .string()
          .describe(
            'The provider\'s transaction type VERBATIM, e.g. "Journal Entry", "Credit Card Expense". A report label, not a queryable entity name.'
          ),
        txnId: z
          .string()
          .describe("The provider's transaction id. Groups lines into one entry with txnType."),
        txnDate: z.string().describe('YYYY-MM-DD.'),
        providerAccountId: z
          .string()
          .describe('QuickBooks Account.Id, carried down from the enclosing section header.'),
        providerAccountName: z
          .string()
          .describe('As rendered on the report. Not used to join - the id is the join key.'),
        debitMinor: z
          .number()
          .int()
          .describe('Integer minor units. At most one of debitMinor / creditMinor is non-zero.'),
        creditMinor: z.number().int().describe('Integer minor units.'),
        docNumber: z.string().nullable(),
        memo: z.string().nullable(),
      })
    ),
  }),
  // Transaction 139 out of the 2026-09-10 sandbox fixture, verbatim: two lines,
  // one entry, and the liability side is a DEBIT even though a liability's
  // natural direction is credit - which is the whole reason this tool asks for
  // debt_amt / credit_amt instead of the default subt_nat_amount.
  exampleOutput: {
    from: '2025-01-01',
    to: '2025-01-31',
    currency: 'USD',
    hasData: true,
    lines: [
      {
        txnType: 'Credit Card Credit',
        txnId: '139',
        txnDate: '2025-01-09',
        providerAccountId: '35',
        providerAccountName: 'Checking',
        debitMinor: 0,
        creditMinor: 90000,
        docNumber: null,
        memo: null,
      },
      {
        txnType: 'Credit Card Credit',
        txnId: '139',
        txnDate: '2025-01-09',
        providerAccountId: '41',
        providerAccountName: 'Mastercard',
        debitMinor: 90000,
        creditMinor: 0,
        docNumber: null,
        memo: 'Monthly Payment',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: getQuickbooksGeneralLedgerExecute,
  // No `agent` and no `action` key, like `get_quickbooks_balance_sheet`: the
  // platform invokes it by id through the Lambda tool executor, and it is never
  // offered to an LLM or rendered as a button.
})
