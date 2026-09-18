// src/tools/shared/map-refund-receipt.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedRefundReceipt {
  refundReceiptId: string
  docNumber: string | null
  txnDate: string | null
  totalAmt: number
  syncToken: string
}

export function mapRefundReceipt(raw: any): MappedRefundReceipt {
  return {
    refundReceiptId: String(raw?.Id ?? ''),
    docNumber: raw?.DocNumber ?? null,
    txnDate: raw?.TxnDate ?? null,
    totalAmt: Number(raw?.TotalAmt ?? 0),
    syncToken: String(raw?.SyncToken ?? '0'),
  }
}
