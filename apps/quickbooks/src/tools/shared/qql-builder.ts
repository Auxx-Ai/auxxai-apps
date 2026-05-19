// src/tools/shared/qql-builder.ts

/**
 * Injection-safe QQL WHERE-clause assembly. QQL is QuickBooks' SQL-ish
 * query language; the API doesn't take prepared statements, so any
 * untrusted string we splice in has to be escaped first.
 *
 * - String literals: single-quote enclosed; embedded single quotes are
 *   doubled (`O'Brien` → `'O''Brien'`).
 * - QB ids: numeric strings only — validate before splicing into
 *   `<column> = <id>` (no quoting needed).
 * - ISO dates: validated to YYYY-MM-DD; spliced as `'YYYY-MM-DD'`.
 *
 * See plans/kopilot/apps/quickbooks-overhaul.md §7.5.
 */

import { invalidInput } from './connection'

export function quoteQqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

export function validateQbId(value: string, field: string): string {
  if (!/^\d+$/.test(value))
    invalidInput(`${field} must be a numeric QuickBooks id, got "${value}".`)
  return value
}

export function validateIsoDate(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    invalidInput(`${field} must be YYYY-MM-DD, got "${value}".`)
  return value
}

export function joinWhere(clauses: (string | null | undefined)[]): string | undefined {
  const kept = clauses.filter((c): c is string => Boolean(c && c.length))
  return kept.length ? kept.join(' AND ') : undefined
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
