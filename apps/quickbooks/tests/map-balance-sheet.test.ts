// tests/map-balance-sheet.test.ts

import { describe, expect, it } from 'vitest'
import { mapBalanceSheet, type ProviderBalanceRow } from '../src/tools/shared/map-balance-sheet'
import balanceSheet20251231 from './fixtures/balance-sheet-2025-12-31.json'
import balanceSheetEmptyNetIncome from './fixtures/balance-sheet-empty-net-income.json'

function findRow(rows: ProviderBalanceRow[], id: string) {
  return rows.find((r) => r.providerAccountId === id)
}

function sumMinor(rows: ProviderBalanceRow[]): number {
  return rows.reduce((total, r) => total + r.minorSigned, 0)
}

describe('mapBalanceSheet - 2025-12-31 fixture (real sandbox response)', () => {
  const mapped = mapBalanceSheet(balanceSheet20251231.report, '2025-12-31')

  it('emits 14 rows: 13 accounts plus the computed net_income row', () => {
    expect(mapped.rows).toHaveLength(14)
  })

  it('maps Checking as a plain asset, debit-positive', () => {
    expect(findRow(mapped.rows, '35')).toEqual({
      providerAccountId: '35',
      name: 'Checking',
      kind: 'account',
      minorSigned: 120100,
    })
  })

  it('negates a liability so it reads debit-positive', () => {
    expect(findRow(mapped.rows, '33')).toMatchObject({
      name: 'Accounts Payable (A/P)',
      kind: 'account',
      minorSigned: -160267,
    })
  })

  it('flips a contra-equity balance to a positive debit', () => {
    // "-9337.50" under TotalLiabilitiesAndEquity negates to +933750.
    expect(findRow(mapped.rows, '34')).toMatchObject({
      name: 'Opening Balance Equity',
      kind: 'account',
      minorSigned: 933750,
    })
  })

  it('negates Retained Earnings like any other equity balance', () => {
    expect(findRow(mapped.rows, '2')).toMatchObject({
      name: 'Retained Earnings',
      kind: 'account',
      minorSigned: -173885,
    })
  })

  it('emits the Net Income row with a null id and kind net_income', () => {
    const netIncome = mapped.rows.find((r) => r.kind === 'net_income')
    expect(netIncome).toMatchObject({
      providerAccountId: null,
      name: 'Net Income',
      kind: 'net_income',
      minorSigned: 9639,
    })
  })

  it('drops a zero-balance row', () => {
    expect(mapped.rows.find((r) => r.name === 'Arizona Dept. of Revenue Payable')).toBeUndefined()
  })

  it('never emits the parent Section header, only its Data child', () => {
    // "Truck" (id 37) is a Section whose Header carries the parent id with an
    // empty money cell; only "Original Cost" (id 38), the Data row under it,
    // should be emitted.
    expect(findRow(mapped.rows, '37')).toBeUndefined()
    expect(findRow(mapped.rows, '38')).toEqual({
      providerAccountId: '38',
      name: 'Original Cost',
      kind: 'account',
      minorSigned: 1349500,
    })
  })

  it('sums to zero across every row, including net_income', () => {
    expect(sumMinor(mapped.rows)).toBe(0)
  })

  it('carries the header facts', () => {
    expect(mapped.currency).toBe('USD')
    expect(mapped.hasData).toBe(true)
    expect(mapped.reportBasis).toBe('Accrual')
    expect(mapped.asOf).toBe('2025-12-31')
  })
})

describe('mapBalanceSheet - empty Net Income fixture (real sandbox response)', () => {
  const mapped = mapBalanceSheet(balanceSheetEmptyNetIncome.report, '2026-06-30')

  it('emits no net_income row when the money cell is the empty string', () => {
    expect(mapped.rows.find((r) => r.kind === 'net_income')).toBeUndefined()
  })

  it('still sums to zero across the remaining rows', () => {
    // "" parses to zero and is dropped, but on this fixture Retained Earnings
    // is already lower by exactly the omitted Net Income, so the report still
    // balances without it.
    expect(sumMinor(mapped.rows)).toBe(0)
  })

  it('carries the header facts', () => {
    expect(mapped.currency).toBe('USD')
    expect(mapped.hasData).toBe(true)
    expect(mapped.reportBasis).toBe('Accrual')
  })
})

describe('mapBalanceSheet - refusals', () => {
  const validReport = balanceSheet20251231.report

  it('throws when Header.EndPeriod does not match the requested asOf', () => {
    expect(() => mapBalanceSheet(validReport, '2026-01-15')).toThrow(/2025-12-31.*2026-01-15/s)
  })

  it('throws naming the row when a money string is malformed', () => {
    const bad = structuredClone(validReport) as any
    bad.Rows.Row[0].Rows.Row[0].Rows.Row[0].Rows.Row[0].ColData[1].value = '12.3.4'
    expect(() => mapBalanceSheet(bad, '2025-12-31')).toThrow(/Checking/)
  })

  it('throws naming an unknown top-level section group', () => {
    const bad = structuredClone(validReport) as any
    bad.Rows.Row[0].group = 'SomethingElse'
    expect(() => mapBalanceSheet(bad, '2025-12-31')).toThrow(/SomethingElse/)
  })
})
