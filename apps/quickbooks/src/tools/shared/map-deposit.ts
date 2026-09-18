// src/tools/shared/map-deposit.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Deposit carries no DocNumber in QuickBooks — omitted here rather than faked as null. */
export interface MappedDeposit {
  depositId: string
  txnDate: string | null
  totalAmt: number
  syncToken: string
}

export function mapDeposit(raw: any): MappedDeposit {
  return {
    depositId: String(raw?.Id ?? ''),
    txnDate: raw?.TxnDate ?? null,
    totalAmt: Number(raw?.TotalAmt ?? 0),
    syncToken: String(raw?.SyncToken ?? '0'),
  }
}
