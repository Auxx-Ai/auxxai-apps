// src/tools/shared/map-purchase.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mapLinkedTxns, type MappedLinkedTxn } from './map-linked-txns'

export interface MappedPurchaseLine {
  amount: number
  /** `AccountBasedExpenseLineDetail.AccountRef` — null on an item line. */
  accountId: string | null
  /** `ItemBasedExpenseLineDetail.ItemRef` — null on an account line. */
  itemId: string | null
  linkedTxns: MappedLinkedTxn[]
}

/** QuickBooks' Expense, Check and Credit Card Expense/Credit are all one `Purchase` entity. */
export interface MappedPurchase {
  id: string
  syncToken: string
  txnDate: string | null
  docNumber: string | null
  totalAmt: number
  paymentType: 'Cash' | 'Check' | 'CreditCard'
  /** `Credit` — true on a Credit Card Credit (a refund to the card), false on a charge. */
  credit: boolean
  /** `AccountRef` — the bank or card account paid from. */
  accountId: string | null
  entityId: string | null
  entityType: 'Vendor' | 'Customer' | 'Employee' | null
  lines: MappedPurchaseLine[]
}

export function mapPurchase(raw: any): MappedPurchase {
  const rawLines: any[] = Array.isArray(raw?.Line) ? raw.Line : []
  return {
    id: String(raw?.Id ?? ''),
    syncToken: String(raw?.SyncToken ?? '0'),
    txnDate: raw?.TxnDate ?? null,
    docNumber: raw?.DocNumber ?? null,
    totalAmt: Number(raw?.TotalAmt ?? 0),
    paymentType: raw?.PaymentType,
    credit: raw?.Credit === true,
    accountId: raw?.AccountRef?.value ?? null,
    entityId: raw?.EntityRef?.value ?? null,
    entityType: raw?.EntityRef?.type ?? null,
    lines: rawLines.map((line) => ({
      amount: Number(line?.Amount ?? 0),
      accountId: line?.AccountBasedExpenseLineDetail?.AccountRef?.value ?? null,
      itemId: line?.ItemBasedExpenseLineDetail?.ItemRef?.value ?? null,
      linkedTxns: mapLinkedTxns(line?.LinkedTxn),
    })),
  }
}
