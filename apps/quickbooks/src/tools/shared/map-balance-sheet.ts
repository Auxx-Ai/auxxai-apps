// src/tools/shared/map-balance-sheet.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { InvalidInputError } from '@auxx/sdk/server'

/** A single account or computed line out of a mapped BalanceSheet report. */
export interface ProviderBalanceRow {
  /** QuickBooks Account.Id. Null only for a computed row (see below). */
  providerAccountId: string | null
  /** As rendered, for the unmatched list. Not used to join. */
  name: string
  /** 'account' | 'net_income'. Nothing else is emitted. */
  kind: 'account' | 'net_income'
  /** Integer minor units, DEBIT-POSITIVE. See below. */
  minorSigned: number
}

/** The mapped shape of a QuickBooks BalanceSheet report. */
export interface ProviderBalanceSheet {
  /** `Header.EndPeriod`, asserted equal to the `asOf` that was asked for. */
  asOf: string
  /** `Header.Currency`, the company's home currency. */
  currency: string
  /** `Header.ReportBasis`. Always 'Accrual' from this tool; carried so a reader can check. */
  reportBasis: string
  /** `Header.Option[NoReportData] === 'false'`. False is the empty-import refusal. */
  hasData: boolean
  /** Non-zero rows only, in report order. */
  rows: ProviderBalanceRow[]
}

const MONEY_RE = /^-?\d+(\.\d{1,2})?$/

/**
 * Parse a QuickBooks money string into integer minor units, from the string
 * only, never through a float. `""` is zero - the 2026-06-30 sandbox run
 * returned the Net Income cell as the empty string.
 */
function parseMoneyMinor(value: string, rowName: string): number {
  if (value === '') return 0
  if (!MONEY_RE.test(value)) {
    throw new InvalidInputError(
      `Balance sheet row "${rowName}" has an unparseable amount: "${value}"`
    )
  }
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [wholePart, centsPart = ''] = unsigned.split('.')
  const cents = `${centsPart}00`.slice(0, 2)
  const minor = Number(wholePart) * 100 + Number(cents)
  return negative ? -minor : minor
}

function dataRowName(row: any): string {
  return row.ColData?.[0]?.value ?? ''
}

/**
 * Walk one level of `Rows.Row`, emitting `Data` rows and recursing through
 * `Section` rows. `Header` and `Summary` cells are never read here: a parent
 * account renders as a `Section` whose `Header` carries the parent's id next
 * to an empty money cell, its children as `Data` rows underneath it, and a
 * `Summary` holding the subtree total. Reading a `Summary` on top of the
 * `Data` rows it summarizes would double-count that account.
 */
function walkRows(
  rows: any[] | undefined,
  sectionMultiplier: number,
  out: ProviderBalanceRow[]
): void {
  for (const row of rows ?? []) {
    if (row.type === 'Data') {
      emitDataRow(row, sectionMultiplier, out)
    } else {
      walkRows(row.Rows?.Row, sectionMultiplier, out)
    }
  }
}

function emitDataRow(row: any, sectionMultiplier: number, out: ProviderBalanceRow[]): void {
  const name = dataRowName(row)
  const id: string | undefined = row.ColData?.[0]?.id
  const moneyCell: string = row.ColData?.[1]?.value ?? ''

  if (id != null) {
    const minorSigned = sectionMultiplier * parseMoneyMinor(moneyCell, name)
    if (minorSigned === 0) return
    out.push({ providerAccountId: id, name, kind: 'account', minorSigned })
    return
  }

  if (row.group === 'NetIncome') {
    const minorSigned = sectionMultiplier * parseMoneyMinor(moneyCell, name)
    if (minorSigned === 0) return
    out.push({ providerAccountId: null, name, kind: 'net_income', minorSigned })
    return
  }

  console.warn(
    `map-balance-sheet: Data row "${name}" has no account id and is not Net Income - skipping`
  )
}

/**
 * Map a raw QuickBooks BalanceSheet report into flat, signed, debit-positive
 * rows.
 *
 * Sign is normalized here, once, instead of carrying a per-row direction
 * downstream: the report's own sign convention differs by top-level section
 * (assets are natural debits, liabilities and equity are natural credits),
 * and folding that into one multiplier at the point each row is read beats
 * making every consumer re-derive it. `rowsToJournalEntryLines` is the only
 * place sign becomes `direction` again, and it already is the only place
 * that happens - one edge, not four downstream.
 *
 * Only `Data` rows are summed, never a `Summary`. A parent account renders as
 * a `Section` whose `Summary` holds the subtree total and whose children are
 * `Data` rows underneath it, so summing a `Summary` on top of its own
 * children double-counts that account - and the report still balances
 * afterward, because the double count is symmetric. `chart-import.ts`
 * creates one `gl_account` per provider account, flattening the hierarchy,
 * so `Data` rows map 1:1 onto our chart and summaries have no counterpart by
 * construction.
 */
export function mapBalanceSheet(report: unknown, asOf: string): ProviderBalanceSheet {
  const r = (report ?? {}) as any
  const header = r.Header ?? {}
  const endPeriod = header.EndPeriod

  if (endPeriod !== asOf) {
    throw new InvalidInputError(
      `Balance sheet Header.EndPeriod "${endPeriod}" does not match the requested asOf "${asOf}"`
    )
  }

  const rows: ProviderBalanceRow[] = []
  for (const topRow of r.Rows?.Row ?? []) {
    let sectionMultiplier: number
    if (topRow.group === 'TotalAssets') {
      sectionMultiplier = 1
    } else if (topRow.group === 'TotalLiabilitiesAndEquity') {
      sectionMultiplier = -1
    } else {
      throw new InvalidInputError(
        `Balance sheet has an unexpected top-level section group: "${topRow.group}"`
      )
    }
    walkRows(topRow.Rows?.Row, sectionMultiplier, rows)
  }

  const options: any[] = header.Option ?? []
  const noReportData = options.find((o) => o?.Name === 'NoReportData')
  const hasData = noReportData ? noReportData.Value === 'false' : true

  return {
    asOf: endPeriod,
    currency: header.Currency,
    reportBasis: header.ReportBasis,
    hasData,
    rows,
  }
}
