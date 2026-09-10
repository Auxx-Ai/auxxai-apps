// src/tools/get-quickbooks-balance-sheet.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapBalanceSheet, type ProviderBalanceSheet } from './shared/map-balance-sheet'

const AS_OF_RE = /^\d{4}-\d{2}-\d{2}$/

interface GetQuickbooksBalanceSheetInput {
  asOf: string
  accountingMethod?: 'Accrual' | 'Cash'
}

/**
 * Fetch the QuickBooks BalanceSheet report as of a date and return it mapped
 * to flat, signed, debit-positive rows (see `map-balance-sheet.ts`).
 *
 * `as_of` is not a parameter Intuit knows - it is silently ignored, and
 * `end_date` alone is ALSO ignored: without `start_date` the report comes
 * back under `DateMacro: "this calendar year-to-date"` with `EndPeriod` set
 * to today, not the date asked for. Send both `start_date` and `end_date` as
 * the same cutover date. `start_date` does not move the Retained Earnings /
 * Net Income split either way - `start=2025-01-01` and `start=2025-12-31`
 * with `end=2025-12-31` returned identical equity rows against the sandbox
 * (verified 2026-09-10), so `start_date = end_date` is the simplest correct
 * call.
 */
export default async function getQuickbooksBalanceSheet(
  input: GetQuickbooksBalanceSheetInput
): Promise<ProviderBalanceSheet> {
  if (!AS_OF_RE.test(input.asOf)) {
    throw new InvalidInputError(`asOf must be YYYY-MM-DD, got "${input.asOf}"`)
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const params = new URLSearchParams()
  params.set('start_date', input.asOf)
  params.set('end_date', input.asOf)
  params.set('accounting_method', input.accountingMethod ?? 'Accrual')

  const path = `/reports/BalanceSheet?${params.toString()}`
  const report = await quickbooksApi<Record<string, unknown>>(realmId, path, credential, {
    sandbox,
  })

  return mapBalanceSheet(report, input.asOf)
}
