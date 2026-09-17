// apps/quickbooks/tests/delete-journal-entry.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/blocks/quickbooks/shared/quickbooks-api', () => ({
  quickbooksApi: vi.fn(),
  quickbooksFault: (error: unknown) =>
    (error as { quickbooksFault?: unknown })?.quickbooksFault ?? null,
}))
vi.mock('../src/tools/shared/connection', () => ({
  getQuickbooksConnection: vi.fn(async () => ({
    credential: 'token',
    realmId: 'company-A',
    sandbox: true,
  })),
}))

import { quickbooksApi } from '../src/blocks/quickbooks/shared/quickbooks-api'
import deleteJournal from '../src/tools/delete-quickbooks-journal-entry.tool.server'

/** An error as `quickbooksApi` raises it: the parsed Intuit fault rides along. */
function faulted(message: string, code: string): Error {
  const error = new Error(message)
  Object.defineProperty(error, 'quickbooksFault', {
    value: { code, message, detail: message, element: null },
    enumerable: false,
  })
  return error
}

beforeEach(() => vi.clearAllMocks())

describe('delete_quickbooks_journal_entry', () => {
  it('posts the delete operation with the id and sync token', async () => {
    vi.mocked(quickbooksApi).mockResolvedValue({
      JournalEntry: { Id: '184', SyncToken: '1', domain: 'QBO', status: 'Deleted' },
    })

    const result = await deleteJournal({ journalEntryId: '184', syncToken: '1' })

    expect(quickbooksApi).toHaveBeenCalledWith(
      'company-A',
      '/journalentry?operation=delete',
      'token',
      expect.objectContaining({
        method: 'POST',
        body: { Id: '184', SyncToken: '1' },
      })
    )
    expect(result).toEqual({
      journalEntryId: '184',
      status: 'Deleted',
      alreadyGone: false,
      domain: 'QBO',
    })
  })

  it('resolves rather than raising when the entry is already gone', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(
      faulted('Object Not Found : Something went wrong.', '610')
    )

    await expect(deleteJournal({ journalEntryId: '184', syncToken: '1' })).resolves.toEqual({
      journalEntryId: '184',
      status: 'NotFound',
      alreadyGone: true,
      domain: null,
    })
  })

  it('surfaces a stale sync token as its own refusal, carrying Intuit text', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(
      faulted('Stale Object Error : You and someone else were working on this.', '5010')
    )

    await expect(deleteJournal({ journalEntryId: '184', syncToken: '1' })).rejects.toThrow(
      /has changed since syncToken 1 was read\. Stale Object Error/
    )
  })

  it('passes any other provider refusal through verbatim', async () => {
    vi.mocked(quickbooksApi).mockRejectedValue(
      faulted('The transaction date is in a closed accounting period.', '6210')
    )

    await expect(deleteJournal({ journalEntryId: '184', syncToken: '1' })).rejects.toThrow(
      'The transaction date is in a closed accounting period.'
    )
  })

  it('refuses a missing or non-numeric sync token without HTTP', async () => {
    await expect(deleteJournal({ journalEntryId: '184', syncToken: '' })).rejects.toThrow(
      'syncToken is required'
    )
    await expect(deleteJournal({ journalEntryId: '184', syncToken: 'abc' })).rejects.toThrow(
      'syncToken must be a whole number'
    )
    await expect(deleteJournal({ journalEntryId: ' ', syncToken: '1' })).rejects.toThrow(
      'journalEntryId is required'
    )
    expect(quickbooksApi).not.toHaveBeenCalled()
  })
})
