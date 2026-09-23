// src/tools/shared/map-linked-txns.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MappedLinkedTxn {
  txnId: string
  txnType: string
}

/** A QuickBooks `LinkedTxn` array, with `TxnType` kept verbatim. */
export function mapLinkedTxns(raw: any): MappedLinkedTxn[] {
  return (Array.isArray(raw) ? raw : []).map((linked: any) => ({
    txnId: String(linked?.TxnId ?? ''),
    txnType: String(linked?.TxnType ?? ''),
  }))
}
