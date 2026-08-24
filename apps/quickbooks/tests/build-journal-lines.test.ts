// tests/build-journal-lines.test.ts

import { describe, expect, it } from 'vitest'
import {
  buildJournalLines,
  type JournalLineInput,
} from '../src/blocks/quickbooks/shared/build-journal-lines'

const debit = (amountMinor: number, over: Partial<JournalLineInput> = {}): JournalLineInput => ({
  amountMinor,
  postingType: 'Debit',
  accountId: '92',
  ...over,
})
const credit = (amountMinor: number, over: Partial<JournalLineInput> = {}): JournalLineInput => ({
  amountMinor,
  postingType: 'Credit',
  accountId: '79',
  ...over,
})

describe('buildJournalLines — the money conversion', () => {
  // R4. Workflow.currency is cents, QBO Amount is dollars. A missed conversion
  // inflates the general ledger 100x. This is the assertion that has to hold.
  it('converts minor units to major units', () => {
    const [line] = buildJournalLines([debit(4999), credit(4999)])
    expect(line!.Amount).toBe(49.99)
    expect(line!.Amount).not.toBe(4999)
  })

  it('does not accumulate float error on values that are not exact in binary', () => {
    const lines = buildJournalLines([debit(1010), credit(1010)])
    expect(lines[0]!.Amount).toBe(10.1)
    expect(lines[1]!.Amount).toBe(10.1)
  })

  it('handles a sub-dollar amount', () => {
    const [line] = buildJournalLines([debit(1), credit(1)])
    expect(line!.Amount).toBe(0.01)
  })

  it('handles a large amount without scientific notation', () => {
    const [line] = buildJournalLines([debit(123456789), credit(123456789)])
    expect(line!.Amount).toBe(1234567.89)
  })
})

describe('buildJournalLines — balance', () => {
  // R5. Balancing in floats either rejects a valid entry or accepts one a cent
  // out. QBO answers an imbalance with error 2300, which is a worse place to
  // find out.
  it('accepts a balanced entry', () => {
    expect(() => buildJournalLines([debit(10000), credit(10000)])).not.toThrow()
  })

  it('accepts a many-to-one split that balances', () => {
    expect(() =>
      buildJournalLines([debit(3333), debit(3333), debit(3334), credit(10000)])
    ).not.toThrow()
  })

  it('rejects a one-cent imbalance', () => {
    expect(() => buildJournalLines([debit(10000), credit(9999)])).toThrow(/does not balance/)
  })

  it('names both totals and the difference', () => {
    expect(() => buildJournalLines([debit(10000), credit(9999)])).toThrow(
      /100\.00.*99\.99.*0\.01/
    )
  })

  it('rejects an entry that balances at zero', () => {
    expect(() => buildJournalLines([debit(0), credit(0)])).toThrow()
  })
})

describe('buildJournalLines — validation', () => {
  it('requires at least two lines', () => {
    expect(() => buildJournalLines([debit(100)])).toThrow(/at least two lines/)
  })

  it('rejects a negative amount rather than flipping direction', () => {
    expect(() => buildJournalLines([debit(-100), credit(100)])).toThrow(/must be positive/)
  })

  it('rejects a fractional cent', () => {
    expect(() => buildJournalLines([debit(99.5), credit(99.5)])).toThrow(/must be an integer/)
  })

  it('rejects a missing accountId', () => {
    expect(() => buildJournalLines([debit(100, { accountId: '' }), credit(100)])).toThrow(
      /accountId is required/
    )
  })

  it('names the offending line', () => {
    expect(() => buildJournalLines([debit(100), credit(100, { accountId: '' })])).toThrow(/Line 2/)
  })

  it('rejects an over-long description', () => {
    expect(() =>
      buildJournalLines([debit(100, { description: 'x'.repeat(4001) }), credit(100)])
    ).toThrow(/description exceeds/)
  })
})

describe('buildJournalLines — wire shape', () => {
  it('uses JournalEntryLineDetail, not JournalEntryLine', () => {
    // The docs contradict themselves here; the attribute table and every sample
    // payload use JournalEntryLineDetail.
    const [line] = buildJournalLines([debit(100), credit(100)])
    expect(line!.DetailType).toBe('JournalEntryLineDetail')
  })

  it('carries direction in PostingType only', () => {
    const lines = buildJournalLines([debit(100), credit(100)])
    expect(lines[0]!.JournalEntryLineDetail.PostingType).toBe('Debit')
    expect(lines[1]!.JournalEntryLineDetail.PostingType).toBe('Credit')
    expect(lines[0]!.Amount).toBeGreaterThan(0)
    expect(lines[1]!.Amount).toBeGreaterThan(0)
  })

  it('sends Entity.Type despite it being documented output-only', () => {
    const lines = buildJournalLines([
      debit(100, { entity: { type: 'Customer', id: '58', name: 'Acme' } }),
      credit(100),
    ])
    expect(lines[0]!.JournalEntryLineDetail.Entity).toEqual({
      Type: 'Customer',
      EntityRef: { value: '58', name: 'Acme' },
    })
  })

  it('omits Entity entirely when absent', () => {
    const [line] = buildJournalLines([debit(100), credit(100)])
    expect(line!.JournalEntryLineDetail.Entity).toBeUndefined()
  })

  it('omits optional keys rather than sending undefined', () => {
    const [line] = buildJournalLines([debit(100), credit(100)])
    expect('Description' in line!).toBe(false)
    expect('name' in line!.JournalEntryLineDetail.AccountRef).toBe(false)
  })
})
