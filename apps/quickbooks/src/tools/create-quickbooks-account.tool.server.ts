// src/tools/create-quickbooks-account.tool.server.ts

import { quickbooksApi, quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapAccount, type MappedAccount } from './shared/map-account'

interface CreateQuickbooksAccountInput {
  name: string
  acctNum?: string
  accountType?: string
  accountSubType?: string
  description?: string
  /**
   * Return the existing account instead of failing when one already carries
   * this name or number. Defaults to true.
   */
  reuseExisting?: boolean
}

interface CreateQuickbooksAccountOutput {
  account: MappedAccount
  /** `created` wrote a new account; `existing` found one and wrote nothing. */
  outcome: 'created' | 'existing'
  /** Which key found the existing account. Null on a create. */
  matchedOn: 'acctNum' | 'name' | null
  /**
   * True when `acctNum` was asked for and QuickBooks did not store it — the
   * company has account numbers turned off. See the docblock below.
   */
  acctNumDropped: boolean
}

/** Case- and whitespace-insensitive compare, matching resolve-quickbooks-account. */
function norm(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

/**
 * Create one account in the connected QuickBooks company's chart.
 *
 * The mirror of `resolve_quickbooks_account`: that one finds an account a
 * person already keeps, this one puts an account there that only auxx has. It
 * exists because auxx's chart carries accounts QuickBooks has no counterpart
 * for — every role-bearing clearing account, for one — and until they exist on
 * both sides the export has nowhere to post them.
 *
 * ## Reuse before create, and why it is the default
 *
 * 🛑 This writes into a company's real books, where a duplicate is worse than
 * a refusal: two accounts named "Card Clearing" split a balance in half with
 * no error anywhere, and nobody notices until a reconciliation does not tie
 * out. So the default is to look first — by number, then by name, the same
 * precedence and the same client-side matching `resolve_quickbooks_account`
 * uses and for the same reason (`AcctNum` is not filterable) — and return what
 * is already there.
 *
 * `reuseExisting: false` is for a caller that genuinely means "create a second
 * one"; it is never the path a chart sync should take.
 *
 * Inactive accounts are searched too. An account somebody deactivated still
 * owns its name as far as Intuit is concerned, and creating past it produces
 * the duplicate-name fault rather than a second account.
 *
 * ## `AcctNum` is conditional, and silence is the failure mode
 *
 * QuickBooks only stores account numbers when the company has them enabled
 * (Advanced → Chart of accounts → Enable account numbers). With them off,
 * Intuit accepts the create and drops `AcctNum` — no fault, no warning. A
 * caller that assumed the number landed would then be matching on a field that
 * is permanently null. `acctNumDropped` is that fact, reported rather than
 * inferred, so the caller can say so instead of silently degrading to names.
 *
 * ## Type and subtype
 *
 * Intuit needs `AccountType`, `AccountSubType`, or both; given only a subtype
 * it infers the type. Both are passed through verbatim rather than validated
 * here — the vocabulary is Intuit's, it differs by locale, and a stale
 * allowlist in this file would refuse accounts the API would have taken. An
 * unrecognised value comes back as a QuickBooks fault naming the field, which
 * is a better error than one this tool could write.
 */
export default async function createQuickbooksAccount(
  input: CreateQuickbooksAccountInput
): Promise<CreateQuickbooksAccountOutput> {
  const name = input.name?.trim()
  if (!name) invalidInput('name is required.')

  const acctNum = input.acctNum?.trim() || undefined
  const accountType = input.accountType?.trim() || undefined
  const accountSubType = input.accountSubType?.trim() || undefined
  if (!accountType && !accountSubType) {
    invalidInput('accountType or accountSubType is required — QuickBooks needs at least one.')
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  if (input.reuseExisting !== false) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await quickbooksQuery<any>(realmId, 'Account', credential, {
      returnAll: true,
      sandbox,
    })
    const existing = raw.map(mapAccount)

    const byNumber = acctNum ? existing.filter((a) => norm(a.acctNum) === norm(acctNum)) : []
    if (byNumber.length === 1) {
      return {
        account: byNumber[0]!,
        outcome: 'existing',
        matchedOn: 'acctNum',
        acctNumDropped: false,
      }
    }

    const byName = existing.filter(
      (a) => norm(a.name) === norm(name) || norm(a.fullyQualifiedName) === norm(name)
    )
    if (byName.length === 1) {
      return { account: byName[0]!, outcome: 'existing', matchedOn: 'name', acctNumDropped: false }
    }

    // 🛑 Several hits is NOT a reason to create another one. The chart already
    // has an ambiguity a person has to settle, and adding a third account
    // named the same thing settles nothing.
    for (const [matchedOn, hits] of [
      ['acctNum', byNumber],
      ['name', byName],
    ] as const) {
      if (hits.length > 1) {
        const shown = hits
          .map((a) => `${a.acctNum ? `${a.acctNum} ` : ''}${a.fullyQualifiedName} (id ${a.id})`)
          .join(', ')
        invalidInput(
          `${hits.length} QuickBooks accounts already match by ${matchedOn}: ${shown}. Resolve the duplicate in QuickBooks, then link the right one.`
        )
      }
    }
  }

  const body: Record<string, unknown> = {
    Name: name,
    ...(acctNum && { AcctNum: acctNum }),
    ...(accountType && { AccountType: accountType }),
    ...(accountSubType && { AccountSubType: accountSubType }),
    ...(input.description?.trim() && { Description: input.description.trim() }),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/account', credential, {
    method: 'POST',
    body,
    sandbox,
  })

  const account = mapAccount(result.Account)

  return {
    account,
    outcome: 'created',
    matchedOn: null,
    acctNumDropped: Boolean(acctNum) && !account.acctNum,
  }
}
