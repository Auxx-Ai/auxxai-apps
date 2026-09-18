// src/tools/shared/fault-convergence.ts

import { InvalidInputError, NotFoundError } from '@auxx/sdk/server'
import { quickbooksApi, quickbooksFault } from '../../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './connection'

/** Intuit's `Object Not Found`. Arrives as a 400 on a delete, not a 404. */
const OBJECT_NOT_FOUND_FAULT = '610'
/** Intuit's `Stale Object Error` — the entry changed since the SyncToken was read. */
const STALE_OBJECT_FAULT = '5010'

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Already deleted, or never existed. Matched on Intuit's fault code first and on
 * its sentence only as a fallback, because the code is the stable half. Shared
 * by every delete tool so the regex lives once — see
 * delete-quickbooks-journal-entry.tool.server.ts, the original of this check.
 */
export function isAlreadyGoneFault(error: unknown): boolean {
  const fault = quickbooksFault(error)
  if (fault?.code === OBJECT_NOT_FOUND_FAULT) return true
  if (fault?.code) return false
  if ((error as { code?: unknown })?.code === 'RESOURCE_NOT_FOUND') return true
  return /object not found|does not exist/i.test(message(error))
}

/** A SyncToken older than the row's current one. */
export function isStaleTokenFault(error: unknown): boolean {
  const fault = quickbooksFault(error)
  if (fault?.code === STALE_OBJECT_FAULT) return true
  if (fault?.code) return false
  return /stale object/i.test(message(error))
}

/**
 * True for a `get` that found nothing: Intuit's 610 fault, or a plain 404.
 * `get` tools converge on `{ status: 'NotFound' }` instead of throwing either way.
 */
export function isEntityNotFoundFault(error: unknown): boolean {
  if (error instanceof NotFoundError) return true
  return quickbooksFault(error)?.code === OBJECT_NOT_FOUND_FAULT
}

export interface DeleteQuickbooksEntityInput {
  /** Delete path, e.g. `/salesreceipt?operation=delete`. */
  path: string
  /** Top-level key QuickBooks nests the deleted entity under, e.g. `SalesReceipt`. */
  entityResponseKey: string
  /** What to call the id in a refusal message, e.g. `salesReceiptId`. */
  idLabel: string
  id: string
  syncToken: string
}

export interface DeleteQuickbooksEntityOutput {
  id: string
  /** `NotFound` means QuickBooks had no such entity and nothing was removed. */
  status: 'Deleted' | 'NotFound'
  alreadyGone: boolean
  domain: string | null
}

/**
 * Delete-and-converge, shared by every transactional-object delete tool:
 * 610 (Object Not Found) resolves as `alreadyGone` rather than throwing, 5010
 * (stale SyncToken) is refused carrying Intuit's own sentence, everything else
 * rethrows. Copied out of delete-quickbooks-journal-entry.tool.server.ts so the
 * convergence rules live once instead of once per object type.
 */
export async function deleteQuickbooksEntity(
  input: DeleteQuickbooksEntityInput
): Promise<DeleteQuickbooksEntityOutput> {
  const id = input.id?.trim()
  if (!id) throw new InvalidInputError(`${input.idLabel} is required.`)
  const syncToken = input.syncToken?.trim()
  if (!syncToken) {
    throw new InvalidInputError('syncToken is required — QuickBooks refuses a delete without it.')
  }
  if (!/^\d+$/.test(syncToken)) {
    throw new InvalidInputError(`syncToken must be a whole number, got "${input.syncToken}".`)
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await quickbooksApi<any>(realmId, input.path, credential, {
      method: 'POST',
      sandbox,
      body: { Id: id, SyncToken: syncToken },
    })
    const deleted = result?.[input.entityResponseKey]
    return {
      id: deleted?.Id ? String(deleted.Id) : id,
      status: 'Deleted',
      alreadyGone: false,
      domain: deleted?.domain ?? null,
    }
  } catch (error) {
    if (isAlreadyGoneFault(error)) {
      return { id, status: 'NotFound', alreadyGone: true, domain: null }
    }
    // A stale token is a refusal about WHICH version we asked to delete, not
    // about the delete itself. Intuit's own text is carried so the reason is
    // theirs, not ours.
    if (isStaleTokenFault(error)) {
      throw new InvalidInputError(
        `QuickBooks refused the delete: ${input.idLabel} ${id} has changed since syncToken ${syncToken} was read. ${message(error)}`
      )
    }
    throw error
  }
}
