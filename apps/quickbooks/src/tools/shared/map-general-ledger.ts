// src/tools/shared/map-general-ledger.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { InvalidInputError } from '@auxx/sdk/server'
import { parseMoneyMinor } from './parse-money'

/**
 * One line of a QuickBooks general ledger, flattened: the enclosing section's
 * account carried down, the transaction id lifted off the `txn_type` cell, and
 * debit and credit as separate explicit amounts.
 *
 * 🛑 **One row is one journal LINE, not one entry.** The 2026-09-10 sandbox
 * fixture is 337 rows and 128 transactions. Writing one posting per row would
 * produce 337 single-sided postings instead of 128 balanced entries. Grouping
 * by `(txnType, txnId)` is the consumer's job - this shape is deliberately
 * flat.
 *
 * Mirrors `ProviderLedgerLine` in the platform repo
 * (`packages/lib/src/postings/provider-sync/client.ts`). The two are pinned to
 * each other by hand; there is no shared package between the repos.
 */
export interface ProviderLedgerLine {
  /**
   * The provider's transaction type, VERBATIM: `'Journal Entry'`,
   * `'Credit Card Expense'`, `'Bill Payment (Check)'`, and so on.
   *
   * ⚠️ These are report labels, not queryable entity names. `'Check'` and
   * `'Credit Card Expense'` are both `Purchase` entities over the API. Do not
   * map them to entity names.
   */
  txnType: string
  /** The provider's transaction id. Groups lines into one entry with `txnType`. */
  txnId: string
  /** `YYYY-MM-DD`. */
  txnDate: string
  /** The provider's account id, carried down from the enclosing section header. */
  providerAccountId: string
  /** As rendered by the provider, for messages. Never used to join. */
  providerAccountName: string
  /** Integer minor units. At most one of `debitMinor` / `creditMinor` is non-zero. */
  debitMinor: number
  creditMinor: number
  docNumber: string | null
  memo: string | null
}

/** One chunk of a QuickBooks general ledger, mapped. */
export interface ProviderLedger {
  /** `Header.StartPeriod`, asserted equal to the `from` that was asked for. */
  from: string
  /** `Header.EndPeriod`, asserted equal to the `to` that was asked for. */
  to: string
  /** `Header.Currency`, the company's home currency. */
  currency: string
  /** `Header.Option[NoReportData] === 'false'`. */
  hasData: boolean
  /** Every `Data` row that names a transaction and sits under an account. */
  lines: ProviderLedgerLine[]
}

/**
 * The `ColKey`s this mapper reads, by the name it reads them under.
 *
 * 🛑 `debt_amt` and `credit_amt` are REQUIRED and their absence is a refusal.
 * The report's default money column is `subt_nat_amount`, which is signed in
 * the ACCOUNT'S natural direction rather than debit-positive: a credit card
 * payment renders `-900.00` under Checking AND `-900.00` under Mastercard,
 * because a liability's natural direction is credit (brief 20 §4.3). Intuit
 * silently ignores request parameters it does not like - `as_of` on
 * `BalanceSheet` is the proven case - so "we asked for `columns=`" is not
 * evidence that we got them. Resolving indices off `Columns` and refusing when
 * the explicit debit/credit pair is missing is what stops a mapper from reading
 * natural-signed amounts as debits and producing entries that balance with the
 * liability side inverted.
 */
const REQUIRED_COLUMNS = ['tx_date', 'txn_type', 'debt_amt', 'credit_amt'] as const
const OPTIONAL_COLUMNS = ['doc_num', 'memo'] as const

type RequiredColumn = (typeof REQUIRED_COLUMNS)[number]
type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number]

type ColumnIndex = Record<RequiredColumn, number> & Partial<Record<OptionalColumn, number>>

/** The account a run of `Data` rows belongs to, carried down the recursion. */
interface SectionAccount {
  id: string
  name: string
}

function resolveColumns(report: any): ColumnIndex {
  const columns: any[] = report?.Columns?.Column ?? []
  const byKey = new Map<string, number>()
  columns.forEach((column, index) => {
    const meta: any[] = column?.MetaData ?? []
    const colKey = meta.find((m) => m?.Name === 'ColKey')?.Value
    if (typeof colKey === 'string' && !byKey.has(colKey)) byKey.set(colKey, index)
  })

  const missing = REQUIRED_COLUMNS.filter((key) => !byKey.has(key))
  if (missing.length > 0) {
    throw new InvalidInputError(
      `General ledger response is missing required column(s) ${missing.join(', ')}. ` +
        `Got [${[...byKey.keys()].join(', ')}]. The report must be requested with ` +
        `columns=tx_date,txn_type,doc_num,name,memo,split_acc,debt_amt,credit_amt - the default ` +
        `subt_nat_amount column is signed in each account's natural direction, not debit-positive.`
    )
  }

  const index = {} as ColumnIndex
  for (const key of REQUIRED_COLUMNS) index[key] = byKey.get(key) as number
  for (const key of OPTIONAL_COLUMNS) {
    const at = byKey.get(key)
    if (at !== undefined) index[key] = at
  }
  return index
}

function cellValue(row: any, at: number | undefined): string {
  if (at === undefined) return ''
  const value = row?.ColData?.[at]?.value
  return typeof value === 'string' ? value : ''
}

function textOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

const TXN_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Walk one level of `Rows.Row`, emitting `Data` rows and recursing through
 * `Section` rows with the account carried down.
 *
 * 🛑 **The account is on the enclosing `Section` header, not on the row.**
 * Every account renders as a `Section` whose `Header.ColData[0]` is
 * `{ value: 'Mastercard', id: '41' }`, its transactions as `Data` rows
 * beneath, and its total as the section's own `Summary`. **No `Data` row names
 * its own account.** A walk that reads only `Data` rows produces amounts
 * belonging to no account (brief 20 §4.2).
 *
 * ⚠️ A `Section` header with no id is a GROUPING node, not an account -
 * `Truck`, `Job Materials`, `Utilities` all render that way, with the real
 * account (`Original Cost`, id `38`) one level deeper. Nesting reaches depth 3
 * in the 2026-09-10 fixture. The account is therefore inherited rather than
 * reset: a header without an id keeps whatever the enclosing section gave it.
 * Because it is a recursion PARAMETER and not a running variable, an id-less
 * section can never pick up the id of the previous sibling subtree.
 *
 * `Header` and `Summary` are never read as data. A `Summary` holds the total of
 * the `Data` rows above it, so summing one on top of its own children
 * double-counts that account - and the report still balances afterward, because
 * the double count is symmetric, which is exactly why nothing downstream would
 * catch it.
 */
function walkRows(
  rows: any[] | undefined,
  account: SectionAccount | null,
  columns: ColumnIndex,
  out: ProviderLedgerLine[]
): void {
  for (const row of rows ?? []) {
    if (row?.type === 'Data') {
      emitDataRow(row, account, columns, out)
      continue
    }
    const header = row?.Header?.ColData?.[0]
    const headerId: string | undefined = header?.id
    const next: SectionAccount | null =
      typeof headerId === 'string' && headerId !== ''
        ? { id: headerId, name: typeof header?.value === 'string' ? header.value : '' }
        : account
    walkRows(row?.Rows?.Row, next, columns, out)
  }
}

function emitDataRow(
  row: any,
  account: SectionAccount | null,
  columns: ColumnIndex,
  out: ProviderLedgerLine[]
): void {
  const typeCell = row?.ColData?.[columns.txn_type]
  const txnType: string = typeof typeCell?.value === 'string' ? typeCell.value : ''
  const txnId: string | undefined = typeCell?.id

  const txnDate = cellValue(row, columns.tx_date)
  const debitCell = cellValue(row, columns.debt_amt)
  const creditCell = cellValue(row, columns.credit_amt)
  const where = `General ledger row ${txnDate} ${txnType || '(untyped)'}`

  const debitMinor = parseMoneyMinor(debitCell, `${where} debit`)
  const creditMinor = parseMoneyMinor(creditCell, `${where} credit`)

  // A row with no transaction id is not a transaction. The General Ledger
  // report uses id-less Data rows for derived lines such as a beginning
  // balance, and a beginning balance is precisely what must NOT be read back:
  // the pre-cutover position is brief 19's single opening entry (brief 20
  // §5.4). Skipping is correct; inventing an id to group it by is not.
  if (typeof txnId !== 'string' || txnId === '') {
    console.warn(`map-general-ledger: ${where} has no transaction id - skipping`)
    return
  }

  if (!TXN_DATE_RE.test(txnDate)) {
    throw new InvalidInputError(
      `General ledger transaction ${txnType} ${txnId} has an unparseable date: "${txnDate}"`
    )
  }

  if (debitMinor !== 0 && creditMinor !== 0) {
    throw new InvalidInputError(
      `General ledger transaction ${txnType} ${txnId} has both a debit ("${debitCell}") and a ` +
        `credit ("${creditCell}") on one row`
    )
  }

  if (account === null) {
    // Exactly one row in the 2026-09-10 fixture lands here: a zero-amount
    // Payment carrying "Created by QB Online to link credits to charges",
    // rendered under a "Not Specified" section that has no id. It cannot be
    // posted anywhere, and there is nothing to invent. A row with MONEY on it
    // and no account is a different animal and refuses.
    if (debitMinor !== 0 || creditMinor !== 0) {
      throw new InvalidInputError(
        `General ledger transaction ${txnType} ${txnId} carries an amount but sits under no ` +
          `account section - the enclosing section header has no QuickBooks account id`
      )
    }
    console.warn(
      `map-general-ledger: zero-amount ${txnType} ${txnId} sits under no account section - skipping`
    )
    return
  }

  out.push({
    txnType,
    txnId,
    txnDate,
    providerAccountId: account.id,
    providerAccountName: account.name,
    debitMinor,
    creditMinor,
    docNumber: textOrNull(cellValue(row, columns.doc_num)),
    memo: textOrNull(cellValue(row, columns.memo)),
  })
}

/**
 * Map a raw QuickBooks GeneralLedger report into flat lines with an explicit
 * debit and credit per line.
 *
 * 🛑 The requested range is asserted against `Header.StartPeriod` /
 * `Header.EndPeriod` and a mismatch is a refusal naming both. Intuit silently
 * ignores date parameters it does not recognise - on `BalanceSheet`, `as_of` is
 * dropped and the report falls back to a year-to-date macro - and a ledger
 * chunk labelled with a range it does not actually cover is the failure this
 * catches (brief 20 §4.6). `GeneralLedger` echoed the range exactly in the
 * 2026-09-10 sandbox run; the assertion costs one comparison and does not
 * depend on that staying true.
 */
export function mapGeneralLedger(
  report: unknown,
  range: { from: string; to: string }
): ProviderLedger {
  const r = (report ?? {}) as any
  const header = r.Header ?? {}
  const startPeriod = header.StartPeriod
  const endPeriod = header.EndPeriod

  if (startPeriod !== range.from || endPeriod !== range.to) {
    throw new InvalidInputError(
      `General ledger covers "${startPeriod}".."${endPeriod}" but "${range.from}".."${range.to}" ` +
        `was requested`
    )
  }

  const columns = resolveColumns(r)

  const lines: ProviderLedgerLine[] = []
  walkRows(r.Rows?.Row, null, columns, lines)

  const options: any[] = header.Option ?? []
  const noReportData = options.find((o) => o?.Name === 'NoReportData')
  const hasData = noReportData ? noReportData.Value === 'false' : true

  return {
    from: startPeriod,
    to: endPeriod,
    currency: header.Currency,
    hasData,
    lines,
  }
}
