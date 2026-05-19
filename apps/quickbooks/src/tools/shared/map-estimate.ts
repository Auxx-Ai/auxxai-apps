// src/tools/shared/map-estimate.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { computeEstimateStatus, type EstimateStatus } from './invoice-status'
import type { MappedInvoiceLine } from './map-invoice'

export interface MappedEstimateSummary {
  estimateId: string
  docNumber: string | null
  customerId: string
  customerName: string
  txnDate: string
  expirationDate: string | null
  totalAmt: number
  status: EstimateStatus
}

export interface MappedEstimateDetail extends MappedEstimateSummary {
  emailStatus: 'NotSet' | 'NeedToSend' | 'EmailSent'
  billEmail: string | null
  customerMemo: string | null
  lines: MappedInvoiceLine[]
  syncToken: string
}

function mapLines(lines: any[]): MappedInvoiceLine[] {
  if (!Array.isArray(lines)) return []
  return lines
    .filter((l) => l?.DetailType !== 'SubTotalLineDetail')
    .map((l) => ({
      itemId: l.SalesItemLineDetail?.ItemRef?.value ?? null,
      description: l.Description ?? null,
      amount: Number(l.Amount ?? 0),
      quantity: l.SalesItemLineDetail?.Qty !== undefined ? Number(l.SalesItemLineDetail.Qty) : null,
    }))
}

function normalizeEmailStatus(s: unknown): 'NotSet' | 'NeedToSend' | 'EmailSent' {
  if (s === 'NeedToSend' || s === 'EmailSent') return s
  return 'NotSet'
}

export function mapEstimateSummary(est: any): MappedEstimateSummary {
  return {
    estimateId: String(est.Id ?? ''),
    docNumber: est.DocNumber ?? null,
    customerId: String(est.CustomerRef?.value ?? ''),
    customerName: est.CustomerRef?.name ?? '',
    txnDate: est.TxnDate ?? '',
    expirationDate: est.ExpirationDate ?? null,
    totalAmt: Number(est.TotalAmt ?? 0),
    status: computeEstimateStatus(est),
  }
}

export function mapEstimateDetail(est: any): MappedEstimateDetail {
  return {
    ...mapEstimateSummary(est),
    emailStatus: normalizeEmailStatus(est.EmailStatus),
    billEmail: est.BillEmail?.Address ?? null,
    customerMemo: est.CustomerMemo?.value ?? null,
    lines: mapLines(est.Line ?? []),
    syncToken: String(est.SyncToken ?? '0'),
  }
}
