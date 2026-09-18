// src/tools/shared/map-account.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export type AccountClassification = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'

export interface MappedAccount {
  id: string
  name: string
  fullyQualifiedName: string
  /**
   * The account NUMBER ('1200'), not the id. Null when the company does not use
   * account numbers — Intuit documents no preference gate on this field, so a
   * null here means "resolve by name instead", never "look it up another way".
   *
   * Note `AcctNum` is NOT filterable, so `WHERE AcctNum = '1200'` is unsupported.
   * Any resolver must match client-side off a `returnAll` fetch.
   */
  acctNum: string | null
  accountType: string
  /**
   * QuickBooks' DETAIL type ('Other Current Assets', 'Checking'), one rung
   * finer than `accountType`. Null when Intuit omits it.
   *
   * Carried because it is the only field that survives a round trip: creating
   * an account takes an `AccountSubType`, and reading one back is how a caller
   * confirms QuickBooks filed it where it was asked to. `accountType` alone
   * cannot say that - several subtypes share one type.
   */
  accountSubType: string | null
  classification: AccountClassification
  active: boolean
  /** QuickBooks `ParentRef.value` when `SubAccount` is true, else null. */
  parentId: string | null
  /** QuickBooks' own flag — true when this account has a parent. */
  subAccount: boolean
}

function normalizeClassification(c: unknown): AccountClassification {
  if (c === 'Asset' || c === 'Liability' || c === 'Equity' || c === 'Revenue' || c === 'Expense')
    return c
  return 'Asset'
}

export function mapAccount(a: any): MappedAccount {
  const subAccount = Boolean(a.SubAccount)
  return {
    id: String(a.Id ?? ''),
    name: a.Name ?? '',
    fullyQualifiedName: a.FullyQualifiedName ?? a.Name ?? '',
    acctNum: a.AcctNum ?? null,
    accountType: a.AccountType ?? '',
    accountSubType: a.AccountSubType ?? null,
    classification: normalizeClassification(a.Classification),
    active: a.Active !== false,
    // Only trust ParentRef when SubAccount is true — Intuit can leave a stale
    // ParentRef on a record that was promoted back to top-level.
    parentId: subAccount && a.ParentRef?.value ? String(a.ParentRef.value) : null,
    subAccount,
  }
}
