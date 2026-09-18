// src/tools/create-quickbooks-payment.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { toMajorUnits } from '../blocks/quickbooks/shared/build-journal-lines'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface CreateQuickbooksPaymentInput {
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

interface CreateQuickbooksPaymentOutput {
  paymentId: string
  totalAmt: number
  customerId: string
  unappliedAmt: number
  syncToken: string
}

/** Resolve to major-unit dollars — amountMinor wins, converted the same way the journal tool does. */
function resolveTotalAmt(input: CreateQuickbooksPaymentInput): number {
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

export default async function createQuickbooksPayment(
  input: CreateQuickbooksPaymentInput
): Promise<CreateQuickbooksPaymentOutput> {
  validateQbId(input.customerId, 'customerId')
  const totalAmt = resolveTotalAmt(input)
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')
  if (input.depositToAccountId) validateQbId(input.depositToAccountId, 'depositToAccountId')
  for (const id of input.linkedInvoiceIds ?? []) validateQbId(id, 'linkedInvoiceIds[]')
  if (input.invoiceId) validateQbId(input.invoiceId, 'invoiceId')
  if (input.invoiceId && input.linkedInvoiceIds?.length) {
    invalidInput('Provide either invoiceId or linkedInvoiceIds, not both.')
  }

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const body: Record<string, unknown> = {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/payment', credential, {
    method: 'POST',
    body,
    sandbox,
    requestId: input.requestId,
  })
  const raw = result.Payment
  return {
    paymentId: String(raw.Id),
    totalAmt: Number(raw.TotalAmt ?? 0),
    customerId: String(raw.CustomerRef?.value ?? ''),
    unappliedAmt: Number(raw.UnappliedAmt ?? 0),
    syncToken: String(raw.SyncToken ?? '0'),
  }
}
