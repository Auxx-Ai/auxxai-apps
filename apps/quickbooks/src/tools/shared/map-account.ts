// src/tools/shared/map-account.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export type AccountClassification = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'

export interface MappedAccount {
  id: string
  name: string
  fullyQualifiedName: string
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
    accountType: a.AccountType ?? '',
    classification: normalizeClassification(a.Classification),
    active: a.Active !== false,
  }
}
