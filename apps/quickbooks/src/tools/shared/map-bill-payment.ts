// src/tools/shared/map-bill-payment.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mapLinkedTxns, type MappedLinkedTxn } from './map-linked-txns'

export interface MappedBillPaymentLine {
  amount: number
  linkedTxns: MappedLinkedTxn[]
}

export interface MappedBillPayment {
  id: string
  syncToken: string
  txnDate: string | null
  docNumber: string | null
  totalAmt: number
  vendorId: string | null
  payType: 'Check' | 'CreditCard'
  /** `CheckPayment.BankAccountRef` — set when `payType` is `Check`. */
  bankAccountId: string | null
  /** `CreditCardPayment.CCAccountRef` — set when `payType` is `CreditCard`. */
  creditCardAccountId: string | null
  /** Every line's `LinkedTxn`, flattened; types (Bill, VendorCredit, …) kept verbatim. */
  linkedTxns: MappedLinkedTxn[]
  lines: MappedBillPaymentLine[]
}

export function mapBillPayment(raw: any): MappedBillPayment {
  const rawLines: any[] = Array.isArray(raw?.Line) ? raw.Line : []
  const lines = rawLines.map((line) => ({
    amount: Number(line?.Amount ?? 0),
    linkedTxns: mapLinkedTxns(line?.LinkedTxn),
  }))
  return {
    id: String(raw?.Id ?? ''),
    syncToken: String(raw?.SyncToken ?? '0'),
    txnDate: raw?.TxnDate ?? null,
    docNumber: raw?.DocNumber ?? null,
    totalAmt: Number(raw?.TotalAmt ?? 0),
    vendorId: raw?.VendorRef?.value ?? null,
    payType: raw?.PayType,
    bankAccountId: raw?.CheckPayment?.BankAccountRef?.value ?? null,
    creditCardAccountId: raw?.CreditCardPayment?.CCAccountRef?.value ?? null,
    linkedTxns: lines.flatMap((line) => line.linkedTxns),
    lines,
  }
}
