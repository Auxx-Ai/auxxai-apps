// src/tools/shared/map-sales-receipt.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedSalesReceipt {
  salesReceiptId: string
  docNumber: string | null
  txnDate: string | null
  totalAmt: number
  syncToken: string
}

export function mapSalesReceipt(raw: any): MappedSalesReceipt {
  return {
    salesReceiptId: String(raw?.Id ?? ''),
    docNumber: raw?.DocNumber ?? null,
    txnDate: raw?.TxnDate ?? null,
    totalAmt: Number(raw?.TotalAmt ?? 0),
    syncToken: String(raw?.SyncToken ?? '0'),
  }
}
