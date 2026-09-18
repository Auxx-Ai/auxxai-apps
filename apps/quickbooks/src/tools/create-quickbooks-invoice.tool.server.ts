// src/tools/create-quickbooks-invoice.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { toMajorUnits } from '../blocks/quickbooks/shared/build-journal-lines'
import { processLineItems } from '../blocks/quickbooks/shared/process-lines'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface InvoiceLine {
  itemId: string
  /** Major-unit dollars. Kept for existing agent callers — amountMinor wins when both are given. */
  amount?: number
  /** Integer minor units (cents). Takes precedence over `amount` when both are present. */
  amountMinor?: number
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
  privateNote?: string
  currency?: string
  requestId?: string
}

interface CreateQuickbooksInvoiceOutput {
  invoiceId: string
  docNumber: string | null
  totalAmt: number
  balance: number
  dueDate: string | null
  syncToken: string
}

const DOC_NUMBER_MAX_LENGTH = 21
const PRIVATE_NOTE_MAX_LENGTH = 4000

/** Resolve a line to major-unit dollars — amountMinor wins, converted the same way the journal tool does. */
function resolveLineAmount(line: InvoiceLine, where: string): number {
  if (line.amountMinor != null) {
    if (!Number.isInteger(line.amountMinor) || line.amountMinor <= 0) {
      throw new InvalidInputError(
        `${where}.amountMinor must be a positive integer number of minor units (cents), got ${line.amountMinor}.`
      )
    }
    return toMajorUnits(line.amountMinor)
  }
  if (line.amount != null && line.amount > 0) return line.amount
  throw new InvalidInputError(`${where}: provide amountMinor or a positive amount.`)
}

export default async function createQuickbooksInvoice(
  input: CreateQuickbooksInvoiceInput
): Promise<CreateQuickbooksInvoiceOutput> {
  validateQbId(input.customerId, 'customerId')
  if (!input.lines?.length) invalidInput('lines must contain at least one item.')
  const lines = input.lines.map((line, i) => {
    validateQbId(line.itemId, `lines[${i}].itemId`)
    return { ...line, amount: resolveLineAmount(line, `lines[${i}]`) }
  })
  if (input.dueDate) validateIsoDate(input.dueDate, 'dueDate')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')
  if (input.currency && !/^[A-Z]{3}$/.test(input.currency)) {
    throw new InvalidInputError('currency must be a three-letter ISO code.')
  }
  if (input.docNumber && input.docNumber.length > DOC_NUMBER_MAX_LENGTH) {
    throw new InvalidInputError(
      `docNumber must be at most ${DOC_NUMBER_MAX_LENGTH} characters, got ${input.docNumber.length}.`
    )
  }
  if (input.privateNote && input.privateNote.length > PRIVATE_NOTE_MAX_LENGTH) {
    throw new InvalidInputError(
      `privateNote must be at most ${PRIVATE_NOTE_MAX_LENGTH} characters.`
    )
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const body: Record<string, unknown> = {
    CustomerRef: { value: input.customerId },
    Line: processLineItems(
      lines.map((l) => ({ ...l, quantity: l.quantity ?? 1 })),
      'invoice'
    ),
    ...(input.docNumber && { DocNumber: input.docNumber }),
    ...(input.dueDate && { DueDate: input.dueDate }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.billEmail && { BillEmail: { Address: input.billEmail } }),
    ...(input.customerMemo && { CustomerMemo: { value: input.customerMemo } }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
    ...(input.currency && { CurrencyRef: { value: input.currency } }),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/invoice', credential, {
    method: 'POST',
    body,
    sandbox,
    requestId: input.requestId,
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
