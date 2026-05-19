// src/tools/shared/invoice-status.ts

/**
 * Compute single-enum status for QB sales documents. The raw API
 * returns separate fields (Balance, TotalAmt, PrintStatus, PrivateNote)
 * that have to be combined into a status the LLM can reason about.
 *
 * See plans/kopilot/apps/quickbooks-overhaul.md §7.6.
 */

export type InvoiceStatus = 'Voided' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Open'

export function computeInvoiceStatus(inv: {
  PrintStatus?: string | null
  PrivateNote?: string | null
  Balance?: number | null
  TotalAmt?: number | null
  DueDate?: string | null
}): InvoiceStatus {
  if (inv.PrintStatus === 'Voided' || /VOIDED/i.test(inv.PrivateNote ?? '')) return 'Voided'
  const balance = Number(inv.Balance ?? 0)
  const total = Number(inv.TotalAmt ?? 0)
  if (balance === 0) return 'Paid'
  if (balance > 0 && balance < total) return 'PartiallyPaid'
  if (inv.DueDate && new Date(inv.DueDate) < new Date()) return 'Overdue'
  return 'Open'
}

export type EstimateStatus = 'Pending' | 'Accepted' | 'Closed' | 'Rejected'

export function computeEstimateStatus(est: { TxnStatus?: string | null }): EstimateStatus {
  switch (est.TxnStatus) {
    case 'Accepted':
      return 'Accepted'
    case 'Closed':
      return 'Closed'
    case 'Rejected':
      return 'Rejected'
    default:
      return 'Pending'
  }
}
