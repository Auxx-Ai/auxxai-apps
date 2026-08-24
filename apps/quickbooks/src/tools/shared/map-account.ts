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
  classification: AccountClassification
  active: boolean
}

function normalizeClassification(c: unknown): AccountClassification {
  if (c === 'Asset' || c === 'Liability' || c === 'Equity' || c === 'Revenue' || c === 'Expense')
    return c
  return 'Asset'
}

export function mapAccount(a: any): MappedAccount {
  return {
    id: String(a.Id ?? ''),
    name: a.Name ?? '',
    fullyQualifiedName: a.FullyQualifiedName ?? a.Name ?? '',
    acctNum: a.AcctNum ?? null,
    accountType: a.AccountType ?? '',
    classification: normalizeClassification(a.Classification),
    active: a.Active !== false,
  }
}
