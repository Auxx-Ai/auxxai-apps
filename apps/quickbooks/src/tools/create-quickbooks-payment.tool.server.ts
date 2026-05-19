// src/tools/create-quickbooks-payment.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface CreateQuickbooksPaymentInput {
  customerId: string
  totalAmt: number
  txnDate?: string
  paymentRefNum?: string
  privateNote?: string
  linkedInvoiceIds?: string[]
}

interface CreateQuickbooksPaymentOutput {
  paymentId: string
  totalAmt: number
  customerId: string
  unappliedAmt: number
  syncToken: string
}

export default async function createQuickbooksPayment(
  input: CreateQuickbooksPaymentInput
): Promise<CreateQuickbooksPaymentOutput> {
  validateQbId(input.customerId, 'customerId')
  if (!(input.totalAmt > 0)) invalidInput('totalAmt must be a positive number.')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')
  for (const id of input.linkedInvoiceIds ?? []) validateQbId(id, 'linkedInvoiceIds[]')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const body: Record<string, unknown> = {
    CustomerRef: { value: input.customerId },
    TotalAmt: input.totalAmt,
    ...(input.txnDate && { TxnDate: input.txnDate }),
    ...(input.paymentRefNum && { PaymentRefNum: input.paymentRefNum }),
    ...(input.privateNote && { PrivateNote: input.privateNote }),
    ...(input.linkedInvoiceIds?.length && {
      Line: input.linkedInvoiceIds.map((invoiceId) => ({
        Amount: input.totalAmt / input.linkedInvoiceIds!.length,
        LinkedTxn: [{ TxnId: invoiceId, TxnType: 'Invoice' }],
      })),
    }),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/payment', credential, {
    method: 'POST',
    body,
    sandbox,
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
