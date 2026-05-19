// src/tools/shared/map-payment.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedPaymentSummary {
  paymentId: string
  customerId: string
  customerName: string
  txnDate: string
  totalAmt: number
  unappliedAmt: number
}

export interface MappedPaymentDetail extends MappedPaymentSummary {
  linkedInvoiceIds: string[]
  paymentMethod: string | null
  paymentRefNum: string | null
  privateNote: string | null
  syncToken: string
}

function collectLinkedInvoiceIds(lines: any[]): string[] {
  if (!Array.isArray(lines)) return []
  const ids = new Set<string>()
  for (const line of lines) {
    const linked = line?.LinkedTxn ?? []
    for (const txn of linked) {
      if (txn?.TxnType === 'Invoice' && txn?.TxnId) ids.add(String(txn.TxnId))
    }
  }
  return Array.from(ids)
}

export function mapPaymentSummary(p: any): MappedPaymentSummary {
  return {
    paymentId: String(p.Id ?? ''),
    customerId: String(p.CustomerRef?.value ?? ''),
    customerName: p.CustomerRef?.name ?? '',
    txnDate: p.TxnDate ?? '',
    totalAmt: Number(p.TotalAmt ?? 0),
    unappliedAmt: Number(p.UnappliedAmt ?? 0),
  }
}

export function mapPaymentDetail(p: any): MappedPaymentDetail {
  return {
    ...mapPaymentSummary(p),
    linkedInvoiceIds: collectLinkedInvoiceIds(p.Line ?? []),
    paymentMethod: p.PaymentMethodRef?.name ?? null,
    paymentRefNum: p.PaymentRefNum ?? null,
    privateNote: p.PrivateNote ?? null,
    syncToken: String(p.SyncToken ?? '0'),
  }
}
