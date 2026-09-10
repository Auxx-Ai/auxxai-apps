// tests/map-general-ledger.test.ts

import { describe, expect, it, vi } from 'vitest'
import { mapGeneralLedger, type ProviderLedgerLine } from '../src/tools/shared/map-general-ledger'
import generalLedger from './fixtures/general-ledger.sandbox.json'

/**
 * The 2026-09-10 sandbox fixture, saved raw off `/reports/GeneralLedger`
 * (realm 9341453857213446, 2015-01-01..2026-12-31): 368 KB, 337 `Data` rows,
 * 57 sections, 128 transactions, 17 transaction types.
 */
const RANGE = { from: '2015-01-01', to: '2026-12-31' } as const

const report = generalLedger as unknown

function clone(): any {
  return structuredClone(generalLedger) as any
}

/** Group emitted lines into entries the way the consumer will. Brief 20 §4.4. */
function groupEntries(lines: ProviderLedgerLine[]): Map<string, ProviderLedgerLine[]> {
  const entries = new Map<string, ProviderLedgerLine[]>()
  for (const line of lines) {
    const key = `${line.txnType}|${line.txnId}`
    const bucket = entries.get(key)
    if (bucket) bucket.push(line)
    else entries.set(key, [line])
  }
  return entries
}

describe('mapGeneralLedger - sandbox fixture', () => {
  const mapped = mapGeneralLedger(report, RANGE)

  it('carries the header facts and the range the provider echoed', () => {
    expect(mapped.from).toBe('2015-01-01')
    expect(mapped.to).toBe('2026-12-31')
    expect(mapped.currency).toBe('USD')
    expect(mapped.hasData).toBe(true)
  })

  // 337 Data rows in the fixture, every one of them carrying a transaction id
  // at ColData[1]. 336 are emitted: the one that is not is a ZERO-amount
  // Payment sitting under the id-less "Not Specified" section, which has no
  // account to post to. `ProviderLedgerLine.providerAccountId` is a
  // non-nullable string, so there is nothing to emit and nothing to invent -
  // and a row with MONEY on it and no account refuses instead (below).
  it('emits one line per Data row that has both a transaction id and an account', () => {
    let dataRows = 0
    let withTxnId = 0
    const walk = (rows: any[] | undefined) => {
      for (const row of rows ?? []) {
        if (row?.type === 'Data') {
          dataRows++
          if (row.ColData?.[1]?.id) withTxnId++
          continue
        }
        walk(row?.Rows?.Row)
      }
    }
    walk((generalLedger as any).Rows.Row)

    expect(dataRows).toBe(337)
    expect(withTxnId).toBe(337)
    expect(mapped.lines).toHaveLength(336)
  })

  it('takes the account from the enclosing Section header, not from the row', () => {
    // Transaction 143 renders under two different sections; neither Data row
    // names an account of its own.
    const lines = mapped.lines.filter((l) => l.txnId === '143')
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => [l.providerAccountId, l.providerAccountName])).toEqual(
      expect.arrayContaining([
        ['41', 'Mastercard'],
        ['64', 'Decks and Patios'],
      ])
    )
  })

  // "Truck" is a Section with NO id - a grouping node, not an account - and the
  // real account "Original Cost" (38) is one level deeper. Brief 20 §4.2.
  it('survives an id-less grouping node and uses the account one level deeper', () => {
    const lines = mapped.lines.filter((l) => l.providerAccountId === '38')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toEqual({
      txnType: 'Journal Entry',
      txnId: '6',
      txnDate: '2024-12-10',
      providerAccountId: '38',
      providerAccountName: 'Original Cost',
      debitMinor: 1349500,
      creditMinor: 0,
      docNumber: null,
      memo: 'Opening Balance',
    })
    expect(mapped.lines.some((l) => l.providerAccountName === 'Truck')).toBe(false)
  })

  // Depth 3: "Job Expenses" (58) > "Job Materials" (no id) > "Decks and
  // Patios" (64). The id-less middle node must not reset the account, and must
  // not leak its parent's id onto its children either.
  it('resolves a depth-3 account through an id-less middle node', () => {
    const lines = mapped.lines.filter((l) => l.providerAccountId === '64')
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) expect(line.providerAccountName).toBe('Decks and Patios')
    expect(mapped.lines.some((l) => l.providerAccountName === 'Job Materials')).toBe(false)
  })

  it('never emits a Section header or a Summary as a line', () => {
    // Every emitted account id belongs to a section that actually holds Data
    // rows; the section totals live on `Section.Summary`, which is never read.
    // 57 sections, 57 summaries, and summing one on top of the Data rows it
    // summarises double-counts SYMMETRICALLY - the report still balances, which
    // is exactly why nothing downstream would catch it.
    const entries = groupEntries(mapped.lines)
    expect(entries.size).toBe(128)
    const totalDebit = mapped.lines.reduce((sum, l) => sum + l.debitMinor, 0)
    const totalCredit = mapped.lines.reduce((sum, l) => sum + l.creditMinor, 0)
    expect(totalDebit).toBe(totalCredit)
    // A Summary sneaking in would have doubled this.
    expect(totalDebit).toBe(8134015)
  })

  it('ignores a Summary row that appears inside Rows.Row', () => {
    const withSummaryRow = clone()
    const section = withSummaryRow.Rows.Row[0]
    section.Rows.Row.push({
      type: 'Summary',
      Summary: {
        ColData: [
          { value: 'Total for Checking' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '999999.00' },
          { value: '' },
        ],
      },
    })
    const after = mapGeneralLedger(withSummaryRow, RANGE)
    expect(after.lines).toHaveLength(336)
  })

  it('lands debit and credit on the right sides, never both on one line', () => {
    for (const line of mapped.lines) {
      expect(Number.isInteger(line.debitMinor)).toBe(true)
      expect(Number.isInteger(line.creditMinor)).toBe(true)
      expect(line.debitMinor === 0 || line.creditMinor === 0).toBe(true)
    }
    // 336 lines, 9 of which are genuinely zero on both sides: eight "Inventory
    // Qty Adjust" opening rows whose money cells are both empty, and the ".00"
    // A/R side of the linking Payment. Every other line has exactly one
    // non-zero side.
    const zeroed = mapped.lines.filter((l) => l.debitMinor === 0 && l.creditMinor === 0)
    expect(zeroed).toHaveLength(9)
    expect(mapped.lines.length - zeroed.length).toBe(327)
  })

  it('reads a liability payment as a DEBIT, which subt_nat_amount would not', () => {
    // Transaction 139: Mastercard 900.00 Dr, Checking 900.00 Cr. The default
    // subt_nat_amount column renders BOTH as -900.00, because a liability's
    // natural direction is credit. Brief 20 §4.3.
    const lines = mapped.lines.filter((l) => l.txnId === '139')
    expect(lines).toHaveLength(2)
    expect(lines.find((l) => l.providerAccountId === '41')).toMatchObject({
      debitMinor: 90000,
      creditMinor: 0,
    })
    expect(lines.find((l) => l.providerAccountId === '35')).toMatchObject({
      debitMinor: 0,
      creditMinor: 90000,
    })
  })

  it('parses ".00" rather than refusing it', () => {
    // Brief 20 §4.7: one row renders its debit as ".00", with no leading zero.
    // Both of that Payment's rows do; only the A/R one has an account.
    const raw = (generalLedger as any).Rows.Row.find(
      (s: any) => s.Header?.ColData?.[0]?.id === '84'
    )
    const dotted = raw.Rows.Row.find((r: any) => r.ColData[1].id === '74')
    expect(dotted.ColData[6].value).toBe('.00')

    const linkingPayment = mapped.lines.filter((l) => l.txnType === 'Payment' && l.txnId === '74')
    expect(linkingPayment).toHaveLength(1)
    expect(linkingPayment[0]).toMatchObject({
      providerAccountId: '84',
      debitMinor: 0,
      creditMinor: 0,
    })
  })

  it('parses a NON-zero amount with no leading zero, so the widening is real', () => {
    const dotted = clone()
    dotted.Rows.Row[0].Rows.Row[0].ColData[6].value = '.25'
    dotted.Rows.Row[0].Rows.Row[0].ColData[7].value = ''
    const first = mapGeneralLedger(dotted, RANGE).lines[0]
    expect(first.debitMinor).toBe(25)
  })

  it('nulls an empty doc number and an empty memo, and keeps a real one', () => {
    const withDoc = mapped.lines.find((l) => l.txnId === '91' && l.providerAccountId === '35')
    expect(withDoc).toMatchObject({ docNumber: '10', memo: null })
    const noDoc = mapped.lines.find((l) => l.txnId === '143' && l.providerAccountId === '41')
    expect(noDoc).toMatchObject({ docNumber: null, memo: null })
  })
})

// 🛑 The end-to-end proof the spike ran by hand (brief 20 §4.4), as a test. A
// mapper that read the wrong money column, summed a Summary, or lost the
// enclosing account would fail here rather than quietly writing 337
// single-sided postings.
describe('mapGeneralLedger - grouping by (txnType, txnId) reconstructs balanced entries', () => {
  const entries = groupEntries(mapGeneralLedger(report, RANGE).lines)

  it('yields 128 entries across 17 transaction types', () => {
    expect(entries.size).toBe(128)
    const types = new Set([...entries.keys()].map((k) => k.split('|')[0]))
    expect(types.size).toBe(17)
  })

  it('balances every one of the 128', () => {
    const unbalanced: string[] = []
    for (const [key, lines] of entries) {
      const debit = lines.reduce((sum, l) => sum + l.debitMinor, 0)
      const credit = lines.reduce((sum, l) => sum + l.creditMinor, 0)
      if (debit !== credit) unbalanced.push(`${key}: ${debit} vs ${credit}`)
    }
    expect(unbalanced).toEqual([])
  })

  it('gives every line of an entry the same date', () => {
    for (const [key, lines] of entries) {
      const dates = new Set(lines.map((l) => l.txnDate))
      expect(dates.size, key).toBe(1)
    }
  })
})

describe('mapGeneralLedger - refusals', () => {
  it('refuses when Header.StartPeriod does not match the requested from', () => {
    expect(() => mapGeneralLedger(report, { from: '2026-01-01', to: '2026-12-31' })).toThrow(
      /2015-01-01.*2026-12-31.*2026-01-01.*2026-12-31/s
    )
  })

  it('refuses when Header.EndPeriod does not match the requested to', () => {
    expect(() => mapGeneralLedger(report, { from: '2015-01-01', to: '2026-01-31' })).toThrow(
      /2015-01-01.*2026-12-31.*2015-01-01.*2026-01-31/s
    )
  })

  // 🛑 The mapper resolves column positions off `Columns`, not off fixed
  // indices. Intuit silently ignores request parameters it does not like -
  // `as_of` on BalanceSheet is the proven case - so "we asked for columns=" is
  // not evidence that we got them. Reading the default `subt_nat_amount` at
  // index 6 as a debit would produce entries that balance with the liability
  // side INVERTED. Brief 20 §4.3.
  it('refuses a response whose money columns are the default subt_nat_amount', () => {
    const defaulted = clone()
    defaulted.Columns.Column[6].MetaData[0].Value = 'subt_nat_amount'
    defaulted.Columns.Column[7].MetaData[0].Value = 'rbal_nat_amount'
    expect(() => mapGeneralLedger(defaulted, RANGE)).toThrow(/debt_amt, credit_amt/)
  })

  it('reads the money columns by ColKey rather than by position', () => {
    const reordered = clone()
    const columns = reordered.Columns.Column
    // Swap Debit and Credit, and every row's cells with them.
    ;[columns[6], columns[7]] = [columns[7], columns[6]]
    const swap = (rows: any[] | undefined) => {
      for (const row of rows ?? []) {
        if (row?.type === 'Data') {
          ;[row.ColData[6], row.ColData[7]] = [row.ColData[7], row.ColData[6]]
          continue
        }
        swap(row?.Rows?.Row)
      }
    }
    swap(reordered.Rows.Row)

    const after = mapGeneralLedger(reordered, RANGE)
    const mastercard = after.lines.find((l) => l.txnId === '139' && l.providerAccountId === '41')
    expect(mastercard).toMatchObject({ debitMinor: 90000, creditMinor: 0 })
  })

  it('refuses a row carrying money under no account section', () => {
    const orphaned = clone()
    const notSpecified = orphaned.Rows.Row.at(-1)
    expect(notSpecified.Header.ColData[0].value).toBe('Not Specified')
    expect(notSpecified.Header.ColData[0].id).toBeUndefined()
    notSpecified.Rows.Row[0].ColData[6].value = '125.00'
    expect(() => mapGeneralLedger(orphaned, RANGE)).toThrow(/sits under no account section/)
  })

  it('refuses a row with both a debit and a credit', () => {
    const bothSides = clone()
    const row = bothSides.Rows.Row[0].Rows.Row[0]
    row.ColData[6].value = '10.00'
    row.ColData[7].value = '10.00'
    expect(() => mapGeneralLedger(bothSides, RANGE)).toThrow(/both a debit .* and a credit/)
  })

  it('refuses an unparseable amount, naming the transaction', () => {
    const bad = clone()
    bad.Rows.Row[0].Rows.Row[0].ColData[6].value = '12.3.4'
    expect(() => mapGeneralLedger(bad, RANGE)).toThrow(/unparseable amount: "12\.3\.4"/)
  })

  it('refuses an unparseable date', () => {
    const bad = clone()
    bad.Rows.Row[0].Rows.Row[0].ColData[0].value = '12/31/2025'
    expect(() => mapGeneralLedger(bad, RANGE)).toThrow(/unparseable date: "12\/31\/2025"/)
  })

  // A Data row with no transaction id is not a transaction: the report uses
  // id-less rows for derived lines such as a beginning balance, and a beginning
  // balance is exactly what must not be read back (brief 20 §5.4 - the
  // pre-cutover position is brief 19's single opening entry). Skipped, loudly.
  it('skips a Data row with no transaction id rather than inventing one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const noId = clone()
      delete noId.Rows.Row[0].Rows.Row[0].ColData[1].id
      const after = mapGeneralLedger(noId, RANGE)
      expect(after.lines).toHaveLength(335)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('has no transaction id'))
    } finally {
      warn.mockRestore()
    }
  })
})
