// src/tools/shared/map-journal-entry.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedJournalLine {
  lineId: string | null
  postingType: 'Debit' | 'Credit'
  accountId: string
  accountName: string | null
  /** Integer minor units (cents), converted back from QBO's major-unit decimal. */
  amountMinor: number
  description: string | null
  entityType: 'Customer' | 'Vendor' | 'Employee' | null
  entityId: string | null
  entityName: string | null
}

export interface MappedJournalEntry {
  journalEntryId: string
  docNumber: string | null
  txnDate: string | null
  privateNote: string | null
  adjustment: boolean
  currency: string | null
  lines: MappedJournalLine[]
  /**
   * Debit total in integer minor units, computed from OUR lines.
   *
   * Deliberately NOT QBO's `TotalAmt`: that field is documented to always come
   * back zero on a JournalEntry, so surfacing it would read as "the entry posted
   * $0". Copying the invoice resource's `totalAmt: String(inv.TotalAmt ?? 0)`
   * straight across is the trap this field exists to avoid.
   */
  totalDebitMinor: number
  syncToken: string
}

/**
 * QBO returns money as a major-unit number (49.99). Everything auxx-side is
 * integer minor units, so convert once, here, on the way in.
 *
 * `Math.round` is load-bearing: 49.99 * 100 is 4998.9999999999995 in IEEE 754.
 */
function toMinorUnits(amount: unknown): number {
  const parsed = Number(amount ?? 0)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

function mapLines(lines: any[]): MappedJournalLine[] {
  if (!Array.isArray(lines)) return []
  return (
    lines
      // DescriptionOnlyLine is a valid JE line type but carries no posting; it
      // has no JournalEntryLineDetail and would map to a zero-amount ghost.
      .filter((l) => l?.DetailType === 'JournalEntryLineDetail')
      .map((l) => {
        const detail = l.JournalEntryLineDetail ?? {}
        return {
          lineId: l.Id != null ? String(l.Id) : null,
          postingType: detail.PostingType === 'Credit' ? ('Credit' as const) : ('Debit' as const),
          accountId: String(detail.AccountRef?.value ?? ''),
          accountName: detail.AccountRef?.name ?? null,
          amountMinor: toMinorUnits(l.Amount),
          description: l.Description ?? null,
          entityType: detail.Entity?.Type ?? null,
          entityId: detail.Entity?.EntityRef?.value ? String(detail.Entity.EntityRef.value) : null,
          entityName: detail.Entity?.EntityRef?.name ?? null,
        }
      })
  )
}

export function mapJournalEntry(raw: any): MappedJournalEntry {
  const lines = mapLines(raw?.Line)
  return {
    journalEntryId: String(raw?.Id ?? ''),
    docNumber: raw?.DocNumber ?? null,
    txnDate: raw?.TxnDate ?? null,
    privateNote: raw?.PrivateNote ?? null,
    adjustment: raw?.Adjustment === true,
    currency: raw?.CurrencyRef?.value ?? null,
    lines,
    totalDebitMinor: lines
      .filter((l) => l.postingType === 'Debit')
      .reduce((total, l) => total + l.amountMinor, 0),
    syncToken: String(raw?.SyncToken ?? '0'),
  }
}
