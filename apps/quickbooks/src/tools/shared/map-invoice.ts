// src/tools/shared/map-invoice.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { computeInvoiceStatus, type InvoiceStatus } from './invoice-status'

export interface MappedInvoiceLine {
  itemId: string | null
  description: string | null
  amount: number
  quantity: number | null
}

export interface MappedInvoiceSummary {
  invoiceId: string
  docNumber: string | null
  customerId: string
  customerName: string
  txnDate: string
  dueDate: string | null
  totalAmt: number
  balance: number
  status: InvoiceStatus
}

export interface MappedInvoiceDetail extends MappedInvoiceSummary {
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

export function mapInvoiceSummary(inv: any): MappedInvoiceSummary {
  return {
    invoiceId: String(inv.Id ?? ''),
    docNumber: inv.DocNumber ?? null,
    customerId: String(inv.CustomerRef?.value ?? ''),
    customerName: inv.CustomerRef?.name ?? '',
    txnDate: inv.TxnDate ?? '',
    dueDate: inv.DueDate ?? null,
    totalAmt: Number(inv.TotalAmt ?? 0),
    balance: Number(inv.Balance ?? 0),
    status: computeInvoiceStatus(inv),
  }
}

export function mapInvoiceDetail(inv: any): MappedInvoiceDetail {
  return {
    ...mapInvoiceSummary(inv),
    emailStatus: normalizeEmailStatus(inv.EmailStatus),
    billEmail: inv.BillEmail?.Address ?? null,
    customerMemo: inv.CustomerMemo?.value ?? null,
    lines: mapLines(inv.Line ?? []),
    syncToken: String(inv.SyncToken ?? '0'),
  }
}
