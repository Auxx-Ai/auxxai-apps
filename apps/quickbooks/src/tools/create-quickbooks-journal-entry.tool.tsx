// src/tools/create-quickbooks-journal-entry.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import createQuickbooksJournalEntryExecute from './create-quickbooks-journal-entry.tool.server'

const lineSchema = z.object({
  amountMinor: z
    .number()
    .int()
    .positive()
    .describe(
      'Amount in MINOR UNITS (cents). 4999 means $49.99. Always positive — direction is set by postingType, never by the sign.'
    ),
  postingType: z.enum(['Debit', 'Credit']),
  accountId: z
    .string()
    .describe(
      'QuickBooks account id. Use resolve_quickbooks_account to turn "1200" or a name into an id.'
    ),
  accountName: z
    .string()
    .optional()
    .describe('Optional display name; QuickBooks ignores it for routing.'),
  description: z.string().max(4000).optional(),
  entity: z
    .object({
      type: z.enum(['Customer', 'Vendor', 'Employee']),
      id: z.string(),
      name: z.string().optional(),
    })
    .optional()
    .describe(
      'Required on a line posting to Accounts Receivable or Accounts Payable — QuickBooks cannot age a receivable it cannot attribute.'
    ),
})

export const createQuickbooksJournalEntryTool = defineTool({
  id: 'create_quickbooks_journal_entry',
  name: 'Create QuickBooks journal entry',
  description:
    'Post a journal entry to the QuickBooks general ledger. Needs at least two lines whose debits equal their credits exactly. High blast radius — entries hit the financial statements directly. Amounts are in minor units (cents). Check find_quickbooks_journal_entry first if the entry might already exist.',
  icon: quickbooksIcon,
  inputs: z.object({
    lines: z
      .array(lineSchema)
      .min(2)
      .describe('At least one debit and one credit. Debits must equal credits exactly.'),
    txnDate: z
      .string()
      .optional()
      .describe(
        'YYYY-MM-DD. Defaults to the QuickBooks server date if omitted — always set it explicitly for a period-scoped posting.'
      ),
    docNumber: z
      .string()
      .max(21)
      .optional()
      .describe(
        'Document number, max 21 chars. Filterable, so it doubles as a natural key for duplicate detection.'
      ),
    privateNote: z
      .string()
      .max(4000)
      .optional()
      .describe('Internal memo. NOT filterable — use docNumber if you need to query it back.'),
    adjustment: z.boolean().optional(),
    requestId: z
      .string()
      .max(50)
      .optional()
      .describe(
        'Idempotency key, max 50 chars. Must be deterministic from the posting identity — a random value guarantees nothing. A repeat request with the same key returns the original entry instead of posting again.'
      ),
  }),
  outputs: z.object({
    journalEntry: z.object({
      journalEntryId: z.string(),
      docNumber: z.string().nullable(),
      txnDate: z.string().nullable(),
      privateNote: z.string().nullable(),
      adjustment: z.boolean(),
      currency: z.string().nullable(),
      lines: z.array(
        z.object({
          lineId: z.string().nullable(),
          postingType: z.enum(['Debit', 'Credit']),
          accountId: z.string(),
          accountName: z.string().nullable(),
          amountMinor: z.number().int(),
          description: z.string().nullable(),
          entityType: z.enum(['Customer', 'Vendor', 'Employee']).nullable(),
          entityId: z.string().nullable(),
          entityName: z.string().nullable(),
        })
      ),
      totalDebitMinor: z
        .number()
        .int()
        .describe(
          'Debit total in minor units, computed from the returned lines. QuickBooks own TotalAmt is always zero on a journal entry, so it is deliberately not surfaced.'
        ),
      syncToken: z.string(),
    }),
  }),
  exampleOutput: {
    journalEntry: {
      journalEntryId: '184',
      docNumber: 'AUXX-FUL-20260818',
      txnDate: '2026-08-18',
      privateNote: 'Daily fulfillment summary',
      adjustment: false,
      currency: 'USD',
      lines: [
        {
          lineId: '0',
          postingType: 'Debit',
          accountId: '92',
          accountName: 'Shopify Clearing',
          amountMinor: 124999,
          description: 'DTC fulfillments 2026-08-18',
          entityType: null,
          entityId: null,
          entityName: null,
        },
        {
          lineId: '1',
          postingType: 'Credit',
          accountId: '79',
          accountName: 'Sales — DTC',
          amountMinor: 124999,
          description: 'DTC fulfillments 2026-08-18',
          entityType: null,
          entityId: null,
          entityName: null,
        },
      ],
      totalDebitMinor: 124999,
      syncToken: '0',
    },
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: createQuickbooksJournalEntryExecute,
  agent: {},
})
