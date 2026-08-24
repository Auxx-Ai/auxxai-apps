// src/tools/find-quickbooks-journal-entry.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import findQuickbooksJournalEntryExecute from './find-quickbooks-journal-entry.tool.server'

export const findQuickbooksJournalEntryTool = defineTool({
  id: 'find_quickbooks_journal_entry',
  name: 'Find QuickBooks journal entry',
  description:
    'Look up journal entries by document number or transaction date. Use before create_quickbooks_journal_entry to check whether a summary entry was already posted. Note this DETECTS duplicates rather than preventing them — a miss is not proof that posting is safe.',
  icon: quickbooksIcon,
  inputs: z.object({
    docNumber: z
      .string()
      .optional()
      .describe('Exact document number, e.g. "AUXX-FUL-20260818". The reliable lookup key.'),
    txnDate: z.string().optional().describe('YYYY-MM-DD. Returns every entry posted on that date.'),
    limit: z.number().int().positive().max(1000).optional().describe('Default 20.'),
  }),
  outputs: z.object({
    journalEntries: z.array(
      z.object({
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
        totalDebitMinor: z.number().int(),
        syncToken: z.string(),
      })
    ),
  }),
  exampleOutput: {
    journalEntries: [
      {
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
        ],
        totalDebitMinor: 124999,
        syncToken: '0',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: findQuickbooksJournalEntryExecute,
  agent: {},
})
