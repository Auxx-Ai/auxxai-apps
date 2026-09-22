// src/tools/create-quickbooks-journal-entry.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import {
  type CreateJournalEntryInput,
  type CreateJournalEntryOutput,
  buildJournalEntryBody,
  mapCreatedJournalEntry,
} from './shared/native-creates'

export default async function createQuickbooksJournalEntry(
  input: CreateJournalEntryInput
): Promise<CreateJournalEntryOutput> {
  const body = buildJournalEntryBody(input)
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/journalentry', credential, {
    method: 'POST',
    body,
    sandbox,
    // Intuit-guaranteed idempotence for a repeat delivery of THIS request — the BullMQ-retry
    // case. Never the only guard: the retention window is undocumented.
    requestId: input.requestId,
  })
  return mapCreatedJournalEntry(result?.JournalEntry)
}
