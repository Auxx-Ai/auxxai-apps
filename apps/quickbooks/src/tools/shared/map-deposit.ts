// src/tools/shared/map-deposit.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

/** One deposit line: what it deposits (a linked Payment/Sales Receipt) or what it is coded to. */
export interface MappedDepositLine {
  amount: number
  /** `DepositLineDetail.AccountRef` — set on a line coded to an account, null on a linked one. */
  accountId: string | null
  linkedTxns: Array<{ txnId: string; txnType: string }>
}

/** Deposit carries no DocNumber in QuickBooks — omitted here rather than faked as null. */
export interface MappedDeposit {
  depositId: string
  txnDate: string | null
  totalAmt: number
  syncToken: string
  /** `DepositToAccountRef` — the bank account the money landed in. */
  depositToAccountId: string | null
  lines: MappedDepositLine[]
}

export function mapDeposit(raw: any): MappedDeposit {
  const lines: any[] = Array.isArray(raw?.Line) ? raw.Line : []
  return {
    depositId: String(raw?.Id ?? ''),
    txnDate: raw?.TxnDate ?? null,
    totalAmt: Number(raw?.TotalAmt ?? 0),
    syncToken: String(raw?.SyncToken ?? '0'),
    depositToAccountId: raw?.DepositToAccountRef?.value ?? null,
    lines: lines.map((line) => ({
      amount: Number(line?.Amount ?? 0),
      accountId: line?.DepositLineDetail?.AccountRef?.value ?? null,
      linkedTxns: (Array.isArray(line?.LinkedTxn) ? line.LinkedTxn : []).map((linked: any) => ({
        txnId: String(linked?.TxnId ?? ''),
        txnType: String(linked?.TxnType ?? ''),
      })),
    })),
  }
}
