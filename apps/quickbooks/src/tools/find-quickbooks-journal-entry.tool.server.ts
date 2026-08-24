// src/tools/find-quickbooks-journal-entry.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapJournalEntry, type MappedJournalEntry } from './shared/map-journal-entry'

interface FindJournalEntryInput {
  docNumber?: string
  txnDate?: string
  limit?: number
}

interface FindJournalEntryOutput {
  journalEntries: MappedJournalEntry[]
}

/**
 * Escape a value for a QBO query string literal. QBO uses SQL-ish single quotes,
 * so an apostrophe in a doc number would otherwise break the query — or worse,
 * change what it means.
 */
function quote(value: string): string {
  return `'${value.replace(/'/g, "\\'")}'`
}

/**
 * Look up journal entries by document number or transaction date.
 *
 * Both `DocNumber` and `TxnDate` are filterable; `PrivateNote` is NOT, which is
 * why a note tag cannot be used as a lookup key and `DocNumber` carries that job.
 *
 * This is duplicate DETECTION, not prevention: `DocNumber` uniqueness is only
 * enforced when the company's `WarnDuplicateJournalNumber` preference is on, and
 * the API cannot tell you whether it is. Treat a hit as "already posted", but do
 * not treat a miss as proof that posting is safe.
 */
export default async function findQuickbooksJournalEntry(
  input: FindJournalEntryInput
): Promise<FindJournalEntryOutput> {
  const clauses: string[] = []
  if (input.docNumber) clauses.push(`DocNumber = ${quote(input.docNumber)}`)
  if (input.txnDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.txnDate)) {
      throw new InvalidInputError(`txnDate must be YYYY-MM-DD, got "${input.txnDate}".`)
    }
    clauses.push(`TxnDate = ${quote(input.txnDate)}`)
  }

  if (clauses.length === 0) {
    throw new InvalidInputError('Provide at least one of docNumber or txnDate.')
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'JournalEntry', credential, {
    where: clauses.join(' AND '),
    limit: input.limit ?? 20,
    sandbox,
  })

  return { journalEntries: raw.map(mapJournalEntry) }
}
