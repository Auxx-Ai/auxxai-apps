// src/tools/create-quickbooks-journal-entry.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import {
  buildJournalLines,
  type JournalLineInput,
} from '../blocks/quickbooks/shared/build-journal-lines'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapJournalEntry, type MappedJournalEntry } from './shared/map-journal-entry'

interface CreateJournalEntryInput {
  lines: JournalLineInput[]
  txnDate?: string
  docNumber?: string
  privateNote?: string
  adjustment?: boolean
  requestId?: string
}

interface CreateJournalEntryOutput {
  journalEntry: MappedJournalEntry
}

const DOC_NUMBER_MAX_LENGTH = 21
const PRIVATE_NOTE_MAX_LENGTH = 4000

export default async function createQuickbooksJournalEntry(
  input: CreateJournalEntryInput
): Promise<CreateJournalEntryOutput> {
  // Validate and convert before touching the network: every one of these would
  // come back as an opaque 400 otherwise.
  const Line = buildJournalLines(input.lines)

  if (input.docNumber && input.docNumber.length > DOC_NUMBER_MAX_LENGTH) {
    throw new InvalidInputError(
      `docNumber must be at most ${DOC_NUMBER_MAX_LENGTH} characters, got ${input.docNumber.length}.`
    )
  }
  if (input.privateNote && input.privateNote.length > PRIVATE_NOTE_MAX_LENGTH) {
    throw new InvalidInputError(
      `privateNote must be at most ${PRIVATE_NOTE_MAX_LENGTH} characters.`
    )
  }
  if (input.txnDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.txnDate)) {
    throw new InvalidInputError(`txnDate must be YYYY-MM-DD, got "${input.txnDate}".`)
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const result = await quickbooksApi<any>(realmId, '/journalentry', credential, {
    method: 'POST',
    sandbox,
    // Intuit-guaranteed idempotence for a repeat delivery of THIS request —
    // the BullMQ-retry case. Never the only guard: the retention window is
    // undocumented, so a re-run tomorrow needs the auxx-side id map.
    requestId: input.requestId,
    body: {
      Line,
      ...(input.txnDate && { TxnDate: input.txnDate }),
      ...(input.docNumber && { DocNumber: input.docNumber }),
      ...(input.privateNote && { PrivateNote: input.privateNote }),
      ...(input.adjustment !== undefined && { Adjustment: input.adjustment }),
    },
  })

  return { journalEntry: mapJournalEntry(result?.JournalEntry) }
}
