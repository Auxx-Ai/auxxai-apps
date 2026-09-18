// src/tools/shared/map-credit-memo.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedCreditMemo {
  creditMemoId: string
  docNumber: string | null
  txnDate: string | null
  totalAmt: number
  /** The unapplied remainder of the credit — a CreditMemo is not fully "spent" until this hits 0. */
  balance: number
  syncToken: string
}

export function mapCreditMemo(raw: any): MappedCreditMemo {
  return {
    creditMemoId: String(raw?.Id ?? ''),
    docNumber: raw?.DocNumber ?? null,
    txnDate: raw?.TxnDate ?? null,
    totalAmt: Number(raw?.TotalAmt ?? 0),
    balance: Number(raw?.Balance ?? 0),
    syncToken: String(raw?.SyncToken ?? '0'),
  }
}
