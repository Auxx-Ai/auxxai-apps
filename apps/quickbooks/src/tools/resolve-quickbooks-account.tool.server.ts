// src/tools/resolve-quickbooks-account.tool.server.ts

import { InvalidInputError, NotFoundError } from '@auxx/sdk/server'
import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapAccount, type MappedAccount } from './shared/map-account'

interface ResolveQuickbooksAccountInput {
  query: string
  includeInactive?: boolean
}

interface ResolveQuickbooksAccountOutput {
  account: MappedAccount
  matchedOn: 'acctNum' | 'fullyQualifiedName' | 'name'
}

/** Case- and whitespace-insensitive compare, so "  shopify clearing " matches. */
function norm(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

/**
 * Resolve an account NUMBER ("1200") or NAME ("Shopify Clearing") to its
 * QuickBooks account id.
 *
 * Matching is CLIENT-SIDE, deliberately. `Account.AcctNum` is not filterable, so
 * `SELECT * FROM Account WHERE AcctNum = '1200'` is unsupported by the API — the
 * obvious server-side design does not work. A chart of accounts is a few hundred
 * rows, well inside the 1000-row page cap, so one `returnAll` fetch and an
 * in-memory match is both correct and cheap.
 *
 * Number is tried before name because it is the unambiguous key when present.
 * When the company does not use account numbers every `acctNum` is null and the
 * name arms carry the whole job — that is expected, not a failure.
 *
 * Ambiguity is REFUSED, never resolved by picking the first: this id ends up in
 * a journal entry, and silently posting to the wrong account of two same-named
 * ones is precisely the failure a resolver exists to prevent.
 */
export default async function resolveQuickbooksAccount(
  input: ResolveQuickbooksAccountInput
): Promise<ResolveQuickbooksAccountOutput> {
  const needle = norm(input.query)
  if (!needle) throw new InvalidInputError('query is required')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Account', credential, {
    returnAll: true,
    sandbox,
  })

  const all = raw.map(mapAccount)
  const accounts = input.includeInactive ? all : all.filter((a) => a.active)

  const arms: { matchedOn: ResolveQuickbooksAccountOutput['matchedOn']; hits: MappedAccount[] }[] =
    [
      { matchedOn: 'acctNum', hits: accounts.filter((a) => norm(a.acctNum) === needle) },
      {
        matchedOn: 'fullyQualifiedName',
        hits: accounts.filter((a) => norm(a.fullyQualifiedName) === needle),
      },
      { matchedOn: 'name', hits: accounts.filter((a) => norm(a.name) === needle) },
    ]

  for (const arm of arms) {
    if (arm.hits.length === 1) return { account: arm.hits[0]!, matchedOn: arm.matchedOn }
    if (arm.hits.length > 1) {
      const shown = arm.hits
        .map((a) => `${a.acctNum ? `${a.acctNum} ` : ''}${a.fullyQualifiedName} (id ${a.id})`)
        .join(', ')
      throw new InvalidInputError(
        `"${input.query}" matches ${arm.hits.length} accounts by ${arm.matchedOn}: ${shown}. Use the fully qualified name or the account id.`
      )
    }
  }

  throw new NotFoundError(
    `No ${input.includeInactive ? '' : 'active '}QuickBooks account matches "${input.query}" by number or name.`
  )
}
