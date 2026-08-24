// tests/map-journal-entry.test.ts

import { describe, expect, it } from 'vitest'
import { mapJournalEntry } from '../src/tools/shared/map-journal-entry'

const raw = {
  Id: '184',
  SyncToken: '0',
  DocNumber: 'AUXX-FUL-20260818',
  TxnDate: '2026-08-18',
  PrivateNote: 'Daily fulfillment summary',
  TotalAmt: 0,
  Line: [
    {
      Id: '0',
      DetailType: 'JournalEntryLineDetail',
      Amount: 1249.99,
      Description: 'DTC fulfillments',
      JournalEntryLineDetail: {
        PostingType: 'Debit',
        AccountRef: { value: '92', name: 'Shopify Clearing' },
      },
    },
    {
      Id: '1',
      DetailType: 'JournalEntryLineDetail',
      Amount: 1249.99,
      JournalEntryLineDetail: {
        PostingType: 'Credit',
        AccountRef: { value: '79', name: 'Sales — DTC' },
      },
    },
  ],
}

describe('mapJournalEntry', () => {
  it('converts major units back to integer minor units', () => {
    // 1249.99 * 100 is 124998.99999999999 in IEEE 754 — the rounding matters.
    const mapped = mapJournalEntry(raw)
    expect(mapped.lines[0]!.amountMinor).toBe(124999)
    expect(Number.isInteger(mapped.lines[0]!.amountMinor)).toBe(true)
  })

  // R12. QBO documents TotalAmt as always zero on a JournalEntry, so surfacing
  // it would read as "the entry posted $0".
  it('computes the debit total from our lines, not from TotalAmt', () => {
    const mapped = mapJournalEntry(raw)
    expect(mapped.totalDebitMinor).toBe(124999)
    expect(mapped).not.toHaveProperty('totalAmt')
  })

  it('sums only debits, so a balanced entry does not double', () => {
    expect(mapJournalEntry(raw).totalDebitMinor).toBe(124999)
  })

  it('drops DescriptionOnlyLine, which carries no posting', () => {
    const withNote = {
      ...raw,
      Line: [...raw.Line, { Id: '2', DetailType: 'DescriptionOnlyLine', Description: 'note' }],
    }
    expect(mapJournalEntry(withNote).lines).toHaveLength(2)
  })

  it('maps the entity reference when present', () => {
    const withEntity = {
      ...raw,
      Line: [
        {
          ...raw.Line[0],
          JournalEntryLineDetail: {
            ...raw.Line[0]!.JournalEntryLineDetail,
            Entity: { Type: 'Customer', EntityRef: { value: '58', name: 'Acme' } },
          },
        },
        raw.Line[1],
      ],
    }
    const line = mapJournalEntry(withEntity).lines[0]!
    expect(line.entityType).toBe('Customer')
    expect(line.entityId).toBe('58')
    expect(line.entityName).toBe('Acme')
  })

  it('survives a sparse payload without throwing', () => {
    const mapped = mapJournalEntry({ Id: '1' })
    expect(mapped.journalEntryId).toBe('1')
    expect(mapped.lines).toEqual([])
    expect(mapped.totalDebitMinor).toBe(0)
    expect(mapped.syncToken).toBe('0')
  })
})
