// src/tools/find-quickbooks-item.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { quoteQqlString } from './shared/qql-builder'

interface FindItemInput {
  name: string
}

type FindItemOutput =
  | {
      status: 'Found'
      itemId: string
      name: string
      incomeAccountId: string | null
      syncToken: string
    }
  | { status: 'NotFound' }

/**
 * Look up an item by exact name — reuse-before-create for the generic Service
 * item T13 maps onto each income `gl_account`. Exact match only: QQL has no
 * case-insensitive operator, and a fuzzy match here would risk posting against
 * the wrong item.
 */
export default async function findQuickbooksItem(input: FindItemInput): Promise<FindItemOutput> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Item', credential, {
    where: `Name = ${quoteQqlString(input.name)}`,
    limit: 1,
    sandbox,
  })

  const item = raw[0]
  if (!item) return { status: 'NotFound' }

  return {
    status: 'Found',
    itemId: String(item.Id ?? ''),
    name: item.Name ?? '',
    incomeAccountId: item.IncomeAccountRef?.value ? String(item.IncomeAccountRef.value) : null,
    syncToken: String(item.SyncToken ?? '0'),
  }
}
