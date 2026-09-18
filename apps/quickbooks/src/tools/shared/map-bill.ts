// src/tools/shared/map-bill.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedBill {
  billId: string
  docNumber: string | null
  txnDate: string | null
  totalAmt: number
  /** Amount still owed to the vendor. */
  balance: number
  syncToken: string
}

export function mapBill(raw: any): MappedBill {
  return {
    billId: String(raw?.Id ?? ''),
    docNumber: raw?.DocNumber ?? null,
    txnDate: raw?.TxnDate ?? null,
    totalAmt: Number(raw?.TotalAmt ?? 0),
    balance: Number(raw?.Balance ?? 0),
    syncToken: String(raw?.SyncToken ?? '0'),
  }
}
