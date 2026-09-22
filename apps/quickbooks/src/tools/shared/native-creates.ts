// src/tools/shared/native-creates.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

import { InvalidInputError } from '@auxx/sdk/server'
import {
  buildJournalLines,
  type JournalLineInput,
  toMajorUnits,
} from '../../blocks/quickbooks/shared/build-journal-lines'
import { processLineItems } from '../../blocks/quickbooks/shared/process-lines'
import { buildDepositLines, type DepositLineInput } from './build-deposit-lines'
import { buildExpenseLines, type ExpenseLineInput } from './build-expense-lines'
import { buildSalesItemLines, type SalesItemLineInput } from './build-sales-lines'
import { invalidInput } from './connection'
import { mapBill, type MappedBill } from './map-bill'
import { mapCreditMemo, type MappedCreditMemo } from './map-credit-memo'
import { mapDeposit, type MappedDeposit } from './map-deposit'
import { mapJournalEntry, type MappedJournalEntry } from './map-journal-entry'
import { mapRefundReceipt, type MappedRefundReceipt } from './map-refund-receipt'
import { mapSalesReceipt, type MappedSalesReceipt } from './map-sales-receipt'
import { validateIsoDate, validateQbId } from './qql-builder'

// Validation + request body + answer mapping for every create_quickbooks_<object> tool the
// accounting export calls, shared by those tools and batch_quickbooks_operations.

const DOC_NUMBER_MAX_LENGTH = 21
const PRIVATE_NOTE_MAX_LENGTH = 4000

function validateCurrency(currency: string | undefined): void {
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    throw new InvalidInputError('currency must be a three-letter ISO code.')
  }
}

function validateDocNumber(docNumber: string | undefined): void {
  if (docNumber && docNumber.length > DOC_NUMBER_MAX_LENGTH) {
    throw new InvalidInputError(
      `docNumber must be at most ${DOC_NUMBER_MAX_LENGTH} characters, got ${docNumber.length}.`
    )
  }
}

function validatePrivateNote(privateNote: string | undefined): void {
  if (privateNote && privateNote.length > PRIVATE_NOTE_MAX_LENGTH) {
    throw new InvalidInputError(
      `privateNote must be at most ${PRIVATE_NOTE_MAX_LENGTH} characters.`
    )
  }
}

// ── Invoice ────────────────────────────────────────────────────────────────

export interface InvoiceLine {
  itemId: string
  /** Major-unit dollars. Kept for existing agent callers — amountMinor wins when both are given. */
  amount?: number
  /** Integer minor units (cents). Takes precedence over `amount` when both are present. */
  amountMinor?: number
  quantity?: number
  description?: string
}

export interface CreateInvoiceInput {
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

export interface CreateInvoiceOutput {
  invoiceId: string
  docNumber: string | null
  totalAmt: number
  balance: number
  dueDate: string | null
  syncToken: string
}

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

export function buildInvoiceBody(input: CreateInvoiceInput): Record<string, unknown> {
  validateQbId(input.customerId, 'customerId')
  if (!input.lines?.length) invalidInput('lines must contain at least one item.')
  const lines = input.lines.map((line, i) => {
    validateQbId(line.itemId, `lines[${i}].itemId`)
    return { ...line, amount: resolveLineAmount(line, `lines[${i}]`) }
  })
  if (input.dueDate) validateIsoDate(input.dueDate, 'dueDate')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')
  validateCurrency(input.currency)
  validateDocNumber(input.docNumber)
  validatePrivateNote(input.privateNote)

  return {
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
}

export function mapCreatedInvoice(raw: any): CreateInvoiceOutput {
  return {
    invoiceId: String(raw.Id),
    docNumber: raw.DocNumber ?? null,
    totalAmt: Number(raw.TotalAmt ?? 0),
    balance: Number(raw.Balance ?? 0),
    dueDate: raw.DueDate ?? null,
    syncToken: String(raw.SyncToken ?? '0'),
  }
}

// ── Payment ────────────────────────────────────────────────────────────────

export interface CreatePaymentInput {
  customerId: string
  /** Major-unit dollars. Kept for existing agent callers — amountMinor wins when both are given. */
  totalAmt?: number
  /** Integer minor units (cents). Takes precedence over `totalAmt` when both are present. */
  amountMinor?: number
  txnDate?: string
  paymentRefNum?: string
  privateNote?: string
  /** QuickBooks AccountRef.Id the payment is deposited to (bank or Undeposited Funds). */
  depositToAccountId?: string
  /** Split evenly across every id. Mutually exclusive with `invoiceId`. */
  linkedInvoiceIds?: string[]
  /** Applies the FULL amount to one invoice — the export's usual case, one payment per invoice. */
  invoiceId?: string
  requestId?: string
}

export interface CreatePaymentOutput {
  paymentId: string
  totalAmt: number
  customerId: string
  unappliedAmt: number
  syncToken: string
}

/** Resolve to major-unit dollars — amountMinor wins, converted the same way the journal tool does. */
function resolveTotalAmt(input: CreatePaymentInput): number {
  if (input.amountMinor != null) {
    if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new InvalidInputError(
        `amountMinor must be a positive integer number of minor units (cents), got ${input.amountMinor}.`
      )
    }
    return toMajorUnits(input.amountMinor)
  }
  if (input.totalAmt != null && input.totalAmt > 0) return input.totalAmt
  return invalidInput('Provide amountMinor or a positive totalAmt.')
}

export function buildPaymentBody(input: CreatePaymentInput): Record<string, unknown> {
  validateQbId(input.customerId, 'customerId')
  const totalAmt = resolveTotalAmt(input)
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')
  if (input.depositToAccountId) validateQbId(input.depositToAccountId, 'depositToAccountId')
  for (const id of input.linkedInvoiceIds ?? []) validateQbId(id, 'linkedInvoiceIds[]')
  if (input.invoiceId) validateQbId(input.invoiceId, 'invoiceId')
  if (input.invoiceId && input.linkedInvoiceIds?.length) {
    invalidInput('Provide either invoiceId or linkedInvoiceIds, not both.')
  }

  return {
    CustomerRef: { value: input.customerId },
    TotalAmt: totalAmt,
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.paymentRefNum && { PaymentRefNum: input.paymentRefNum }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
    ...(input.depositToAccountId && { DepositToAccountRef: { value: input.depositToAccountId } }),
    ...(input.invoiceId && {
      Line: [{ Amount: totalAmt, LinkedTxn: [{ TxnId: input.invoiceId, TxnType: 'Invoice' }] }],
    }),
    ...(!input.invoiceId &&
      input.linkedInvoiceIds?.length && {
        Line: input.linkedInvoiceIds.map((invoiceId) => ({
          Amount: totalAmt / input.linkedInvoiceIds!.length,
          LinkedTxn: [{ TxnId: invoiceId, TxnType: 'Invoice' }],
        })),
      }),
  }
}

export function mapCreatedPayment(raw: any): CreatePaymentOutput {
  return {
    paymentId: String(raw.Id),
    totalAmt: Number(raw.TotalAmt ?? 0),
    customerId: String(raw.CustomerRef?.value ?? ''),
    unappliedAmt: Number(raw.UnappliedAmt ?? 0),
    syncToken: String(raw.SyncToken ?? '0'),
  }
}

// ── Sales receipt ──────────────────────────────────────────────────────────

export interface CreateSalesReceiptInput {
  customerId: string
  lines: SalesItemLineInput[]
  depositToAccountId: string
  txnDate?: string
  docNumber?: string
  privateNote?: string
  currency?: string
  requestId?: string
}

export function buildSalesReceiptBody(input: CreateSalesReceiptInput): Record<string, unknown> {
  validateQbId(input.customerId, 'customerId')
  validateQbId(input.depositToAccountId, 'depositToAccountId')
  const Line = buildSalesItemLines(input.lines)
  validateCurrency(input.currency)
  validateDocNumber(input.docNumber)
  validatePrivateNote(input.privateNote)
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  return {
    CustomerRef: { value: input.customerId },
    Line,
    DepositToAccountRef: { value: input.depositToAccountId },
    ...(input.currency && { CurrencyRef: { value: input.currency } }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.docNumber && { DocNumber: input.docNumber }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
  }
}

export const mapCreatedSalesReceipt: (raw: any) => MappedSalesReceipt = mapSalesReceipt

// ── Credit memo ────────────────────────────────────────────────────────────

export interface CreateCreditMemoInput {
  customerId: string
  lines: SalesItemLineInput[]
  txnDate?: string
  docNumber?: string
  privateNote?: string
  currency?: string
  requestId?: string
}

export function buildCreditMemoBody(input: CreateCreditMemoInput): Record<string, unknown> {
  validateQbId(input.customerId, 'customerId')
  const Line = buildSalesItemLines(input.lines)
  validateCurrency(input.currency)
  validateDocNumber(input.docNumber)
  validatePrivateNote(input.privateNote)
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  return {
    CustomerRef: { value: input.customerId },
    Line,
    ...(input.currency && { CurrencyRef: { value: input.currency } }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.docNumber && { DocNumber: input.docNumber }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
  }
}

export const mapCreatedCreditMemo: (raw: any) => MappedCreditMemo = mapCreditMemo

// ── Refund receipt ─────────────────────────────────────────────────────────

export interface CreateRefundReceiptInput {
  customerId: string
  lines: SalesItemLineInput[]
  /**
   * QuickBooks names this field `DepositToAccountRef` on a RefundReceipt too —
   * confusing on a refund, but it is the account the cash comes OUT of.
   */
  paidFromAccountId: string
  txnDate?: string
  docNumber?: string
  privateNote?: string
  currency?: string
  requestId?: string
}

export function buildRefundReceiptBody(input: CreateRefundReceiptInput): Record<string, unknown> {
  validateQbId(input.customerId, 'customerId')
  validateQbId(input.paidFromAccountId, 'paidFromAccountId')
  const Line = buildSalesItemLines(input.lines)
  validateCurrency(input.currency)
  validateDocNumber(input.docNumber)
  validatePrivateNote(input.privateNote)
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  return {
    CustomerRef: { value: input.customerId },
    Line,
    DepositToAccountRef: { value: input.paidFromAccountId },
    ...(input.currency && { CurrencyRef: { value: input.currency } }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.docNumber && { DocNumber: input.docNumber }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
  }
}

export const mapCreatedRefundReceipt: (raw: any) => MappedRefundReceipt = mapRefundReceipt

// ── Deposit ────────────────────────────────────────────────────────────────

export interface CreateDepositInput {
  depositToAccountId: string
  lines: DepositLineInput[]
  txnDate?: string
  privateNote?: string
  currency?: string
  requestId?: string
}

/** Deposit has no DocNumber in QuickBooks, so there is nothing to validate or pass through here. */
export function buildDepositBody(input: CreateDepositInput): Record<string, unknown> {
  validateQbId(input.depositToAccountId, 'depositToAccountId')
  const Line = buildDepositLines(input.lines)
  validateCurrency(input.currency)
  validatePrivateNote(input.privateNote)
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  return {
    DepositToAccountRef: { value: input.depositToAccountId },
    Line,
    ...(input.currency && { CurrencyRef: { value: input.currency } }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
  }
}

export const mapCreatedDeposit: (raw: any) => MappedDeposit = mapDeposit

// ── Bill ───────────────────────────────────────────────────────────────────

export interface CreateBillInput {
  vendorId: string
  lines: ExpenseLineInput[]
  dueDate?: string
  txnDate?: string
  docNumber?: string
  privateNote?: string
  currency?: string
  requestId?: string
}

export function buildBillBody(input: CreateBillInput): Record<string, unknown> {
  validateQbId(input.vendorId, 'vendorId')
  const Line = buildExpenseLines(input.lines)
  validateCurrency(input.currency)
  validateDocNumber(input.docNumber)
  validatePrivateNote(input.privateNote)
  if (input.dueDate) validateIsoDate(input.dueDate, 'dueDate')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  return {
    VendorRef: { value: input.vendorId },
    Line,
    ...(input.currency && { CurrencyRef: { value: input.currency } }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.dueDate && { DueDate: input.dueDate }),
    ...(input.docNumber && { DocNumber: input.docNumber }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
  }
}

export const mapCreatedBill: (raw: any) => MappedBill = mapBill

// ── Journal entry ──────────────────────────────────────────────────────────

export interface CreateJournalEntryInput {
  lines: JournalLineInput[]
  txnDate?: string
  docNumber?: string
  privateNote?: string
  adjustment?: boolean
  requestId?: string
  currency?: string
}

export interface CreateJournalEntryOutput {
  journalEntry: MappedJournalEntry
}

export function buildJournalEntryBody(input: CreateJournalEntryInput): Record<string, unknown> {
  // Validate and convert before touching the network: every one of these would
  // come back as an opaque 400 otherwise.
  const Line = buildJournalLines(input.lines)
  validateCurrency(input.currency)
  validateDocNumber(input.docNumber)
  validatePrivateNote(input.privateNote)
  if (input.txnDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.txnDate)) {
    throw new InvalidInputError(`txnDate must be YYYY-MM-DD, got "${input.txnDate}".`)
  }

  return {
    Line,
    ...(input.currency && { CurrencyRef: { value: input.currency } }),
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.docNumber && { DocNumber: input.docNumber }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
    ...(input.adjustment !== undefined && { Adjustment: input.adjustment }),
  }
}

export function mapCreatedJournalEntry(raw: any): CreateJournalEntryOutput {
  return { journalEntry: mapJournalEntry(raw) }
}

// ── Registry ───────────────────────────────────────────────────────────────

interface NativeCreate<I, O> {
  /** Intuit's entity name: the create answer's top-level key and the batch item's entity key. */
  entity: string
  path: string
  buildBody: (input: I) => Record<string, unknown>
  mapAnswer: (raw: any) => O
}

/** Keyed by the lib's export object type (`packages/lib/src/accounting/export/payloads/*`). */
export const NATIVE_CREATES = {
  invoice: {
    entity: 'Invoice',
    path: '/invoice',
    buildBody: buildInvoiceBody,
    mapAnswer: mapCreatedInvoice,
  } satisfies NativeCreate<CreateInvoiceInput, CreateInvoiceOutput>,
  payment: {
    entity: 'Payment',
    path: '/payment',
    buildBody: buildPaymentBody,
    mapAnswer: mapCreatedPayment,
  } satisfies NativeCreate<CreatePaymentInput, CreatePaymentOutput>,
  sales_receipt: {
    entity: 'SalesReceipt',
    path: '/salesreceipt',
    buildBody: buildSalesReceiptBody,
    mapAnswer: mapCreatedSalesReceipt,
  } satisfies NativeCreate<CreateSalesReceiptInput, MappedSalesReceipt>,
  credit_memo: {
    entity: 'CreditMemo',
    path: '/creditmemo',
    buildBody: buildCreditMemoBody,
    mapAnswer: mapCreatedCreditMemo,
  } satisfies NativeCreate<CreateCreditMemoInput, MappedCreditMemo>,
  refund_receipt: {
    entity: 'RefundReceipt',
    path: '/refundreceipt',
    buildBody: buildRefundReceiptBody,
    mapAnswer: mapCreatedRefundReceipt,
  } satisfies NativeCreate<CreateRefundReceiptInput, MappedRefundReceipt>,
  deposit: {
    entity: 'Deposit',
    path: '/deposit',
    buildBody: buildDepositBody,
    mapAnswer: mapCreatedDeposit,
  } satisfies NativeCreate<CreateDepositInput, MappedDeposit>,
  bill: {
    entity: 'Bill',
    path: '/bill',
    buildBody: buildBillBody,
    mapAnswer: mapCreatedBill,
  } satisfies NativeCreate<CreateBillInput, MappedBill>,
  journal: {
    entity: 'JournalEntry',
    path: '/journalentry',
    buildBody: buildJournalEntryBody,
    mapAnswer: mapCreatedJournalEntry,
  } satisfies NativeCreate<CreateJournalEntryInput, CreateJournalEntryOutput>,
}

export type NativeCreateObject = keyof typeof NATIVE_CREATES
