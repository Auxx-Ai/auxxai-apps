// src/tools/delete-quickbooks-journal-entry.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../assets/icon.png'
import deleteQuickbooksJournalEntryExecute from './delete-quickbooks-journal-entry.tool.server'

export const deleteQuickbooksJournalEntryTool = defineTool({
  id: 'delete_quickbooks_journal_entry',
  name: 'Delete QuickBooks journal entry',
  description:
    'Remove a journal entry from the QuickBooks general ledger. Highest blast radius in this app — the entry disappears from the financial statements. Needs the entry id and its current SyncToken; a stale SyncToken is refused rather than applied, because it means somebody has edited the entry since it was read. Deleting an entry that is already gone succeeds and reports alreadyGone.',
  icon: quickbooksIcon,
  inputs: z.object({
    journalEntryId: z
      .string()
      .min(1)
      .describe(
        'QuickBooks journal entry id, as returned by create/find_quickbooks_journal_entry.'
      ),
    syncToken: z
      .string()
      .min(1)
      .describe(
        "The entry's current SyncToken. Read it back immediately before deleting — QuickBooks refuses a delete carrying an older one, which is how an edit made since is detected rather than discarded."
      ),
  }),
  outputs: z.object({
    journalEntryId: z.string(),
    status: z
      .enum(['Deleted', 'NotFound'])
      .describe('`NotFound` means QuickBooks had no such entry and nothing was removed.'),
    alreadyGone: z.boolean(),
    domain: z.string().nullable(),
  }),
  exampleOutput: {
    journalEntryId: '184',
    status: 'Deleted',
    alreadyGone: false,
    domain: 'QBO',
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: deleteQuickbooksJournalEntryExecute,
  agent: {},
})
