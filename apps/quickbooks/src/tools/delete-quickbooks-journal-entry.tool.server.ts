// src/tools/delete-quickbooks-journal-entry.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksApi, quickbooksFault } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'

interface DeleteJournalEntryInput {
  journalEntryId: string
  syncToken: string
}

interface DeleteJournalEntryOutput {
  journalEntryId: string
  /** `Deleted` when this call removed it; `NotFound` when it was already gone. */
  status: 'Deleted' | 'NotFound'
  /** True when QuickBooks had no such entry, so nothing was removed by THIS call. */
  alreadyGone: boolean
  domain: string | null
}

/** Intuit's `Object Not Found`. Arrives as a 400 on a delete, not a 404. */
const OBJECT_NOT_FOUND_FAULT = '610'
/** Intuit's `Stale Object Error` — the entry changed since the SyncToken was read. */
const STALE_OBJECT_FAULT = '5010'

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Already deleted, or never existed. Matched on Intuit's fault code first and on
 * its sentence only as a fallback, because the code is the stable half.
 */
function isAlreadyGone(error: unknown): boolean {
  const fault = quickbooksFault(error)
  if (fault?.code === OBJECT_NOT_FOUND_FAULT) return true
  if (fault?.code) return false
  if ((error as { code?: unknown })?.code === 'RESOURCE_NOT_FOUND') return true
  return /object not found|does not exist/i.test(message(error))
}

function isStaleToken(error: unknown): boolean {
  const fault = quickbooksFault(error)
  if (fault?.code === STALE_OBJECT_FAULT) return true
  if (fault?.code) return false
  return /stale object/i.test(message(error))
}

/**
 * Delete one journal entry out of the company's books.
 *
 * Converges: an id QuickBooks no longer holds RESOLVES with `alreadyGone`, so a
 * caller retrying after a delete of unknown outcome lands on "not there" rather
 * than on an error it cannot tell apart from a refusal.
 */
export default async function deleteQuickbooksJournalEntry(
  input: DeleteJournalEntryInput
): Promise<DeleteJournalEntryOutput> {
  // Validate before touching the network: either would come back as an opaque
  // 400, and a blank SyncToken reads identically to a stale one.
  const journalEntryId = input.journalEntryId?.trim()
  if (!journalEntryId) {
    throw new InvalidInputError('journalEntryId is required.')
  }
  const syncToken = input.syncToken?.trim()
  if (!syncToken) {
    throw new InvalidInputError('syncToken is required — QuickBooks refuses a delete without it.')
  }
  if (!/^\d+$/.test(syncToken)) {
    throw new InvalidInputError(`syncToken must be a whole number, got "${input.syncToken}".`)
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    const result = await quickbooksApi<any>(realmId, '/journalentry?operation=delete', credential, {
      method: 'POST',
      sandbox,
      body: { Id: journalEntryId, SyncToken: syncToken },
    })
    const deleted = result?.JournalEntry
    return {
      journalEntryId: deleted?.Id ? String(deleted.Id) : journalEntryId,
      status: 'Deleted',
      alreadyGone: false,
      domain: deleted?.domain ?? null,
    }
  } catch (error) {
    if (isAlreadyGone(error)) {
      return { journalEntryId, status: 'NotFound', alreadyGone: true, domain: null }
    }
    // A stale token is a refusal about WHICH version we asked to delete, not
    // about the delete itself, and the caller renders a different sentence for
    // it. Intuit's own text is carried so the reason is theirs, not ours.
    if (isStaleToken(error)) {
      throw new InvalidInputError(
        `QuickBooks refused the delete: journal entry ${journalEntryId} has changed since syncToken ${syncToken} was read. ${message(error)}`
      )
    }
    throw error
  }
}
