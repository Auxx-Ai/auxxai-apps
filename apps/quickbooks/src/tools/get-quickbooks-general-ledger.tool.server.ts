// src/tools/get-quickbooks-general-ledger.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapGeneralLedger, type ProviderLedger } from './shared/map-general-ledger'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * 🛑 The explicit debit/credit columns are not optional and not a preference.
 *
 * The report's default money column is `subt_nat_amount`, signed in each
 * ACCOUNT'S natural direction rather than debit-positive: a credit card payment
 * renders `-900.00` under Checking AND `-900.00` under Mastercard, because a
 * liability's natural direction is credit. A mapper reading that as
 * debit-positive produces entries that do not balance - or worse, ones that
 * balance with the liability side inverted (brief 20 §4.3).
 *
 * `debt_amt` and `credit_amt` come back as separately populated strings with
 * one of them empty per row, which is already the shape `GlPostingLine` wants
 * and removes any dependence on knowing each account's classification.
 */
const GENERAL_LEDGER_COLUMNS =
  'tx_date,txn_type,doc_num,name,memo,split_acc,debt_amt,credit_amt' as const

interface GetQuickbooksGeneralLedgerInput {
  from: string
  to: string
  accountingMethod?: 'Accrual' | 'Cash'
}

/**
 * Fetch the QuickBooks GeneralLedger report for a date range and return it as
 * flat lines with an explicit debit and credit per line (see
 * `shared/map-general-ledger.ts`).
 *
 * ⚠️ **Report endpoints do not paginate.** `STARTPOSITION` and `MAXRESULTS` are
 * clauses inside the `/query` endpoint's SELECT statement, not URL parameters;
 * passing them here is accepted and silently ignored - verified 2026-09-10, the
 * same 337 rows came back with and without them (brief 20 §4.8). **The date
 * range is the only lever**, which is why the caller walks the ledger a month
 * at a time rather than asking for a year and trusting a cursor. A response
 * that silently truncated would be indistinguishable from a quiet month, so
 * chunk size is a safety property and not a performance knob.
 */
export default async function getQuickbooksGeneralLedger(
  input: GetQuickbooksGeneralLedgerInput
): Promise<ProviderLedger> {
  if (!DATE_RE.test(input.from)) {
    throw new InvalidInputError(`from must be YYYY-MM-DD, got "${input.from}"`)
  }
  if (!DATE_RE.test(input.to)) {
    throw new InvalidInputError(`to must be YYYY-MM-DD, got "${input.to}"`)
  }
  if (input.from > input.to) {
    throw new InvalidInputError(`from "${input.from}" is after to "${input.to}"`)
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const params = new URLSearchParams()
  params.set('start_date', input.from)
  params.set('end_date', input.to)
  params.set('columns', GENERAL_LEDGER_COLUMNS)
  params.set('accounting_method', input.accountingMethod ?? 'Accrual')

  const path = `/reports/GeneralLedger?${params.toString()}`
  const report = await quickbooksApi<Record<string, unknown>>(realmId, path, credential, {
    sandbox,
  })

  return mapGeneralLedger(report, { from: input.from, to: input.to })
}
