// src/tools/create-quickbooks-invoice.tool.server.ts

import { processLineItems } from '../blocks/quickbooks/shared/process-lines'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface InvoiceLine {
  itemId: string
  amount: number
  quantity?: number
  description?: string
}

interface CreateQuickbooksInvoiceInput {
  customerId: string
  lines: InvoiceLine[]
  docNumber?: string
  dueDate?: string
  txnDate?: string
  billEmail?: string
  customerMemo?: string
}

interface CreateQuickbooksInvoiceOutput {
  invoiceId: string
  docNumber: string | null
  totalAmt: number
  balance: number
  dueDate: string | null
  syncToken: string
}

export default async function createQuickbooksInvoice(
  input: CreateQuickbooksInvoiceInput
): Promise<CreateQuickbooksInvoiceOutput> {
  validateQbId(input.customerId, 'customerId')
  if (!input.lines?.length) invalidInput('lines must contain at least one item.')
  for (const line of input.lines) validateQbId(line.itemId, 'lines[].itemId')
  if (input.dueDate) validateIsoDate(input.dueDate, 'dueDate')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const body: Record<string, unknown> = {
    CustomerRef: { value: input.customerId },
    Line: processLineItems(
      input.lines.map((l) => ({ ...l, quantity: l.quantity ?? 1 })),
      'invoice'
    ),
    ...(input.docNumber && { DocNumber: input.docNumber }),
    ...(input.dueDate && { DueDate: input.dueDate }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.billEmail && { BillEmail: { Address: input.billEmail } }),
    ...(input.customerMemo && { CustomerMemo: { value: input.customerMemo } }),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/invoice', credential, {
    method: 'POST',
    body,
    sandbox,
  })
  const raw = result.Invoice
  return {
    invoiceId: String(raw.Id),
    docNumber: raw.DocNumber ?? null,
    totalAmt: Number(raw.TotalAmt ?? 0),
    balance: Number(raw.Balance ?? 0),
    dueDate: raw.DueDate ?? null,
    syncToken: String(raw.SyncToken ?? '0'),
  }
}
