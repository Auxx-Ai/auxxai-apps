// src/tools/create-quickbooks-refund-receipt.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { buildSalesItemLines, type SalesItemLineInput } from './shared/build-sales-lines'
import { getQuickbooksConnection } from './shared/connection'
import { mapRefundReceipt, type MappedRefundReceipt } from './shared/map-refund-receipt'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface CreateRefundReceiptInput {
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

const DOC_NUMBER_MAX_LENGTH = 21
const PRIVATE_NOTE_MAX_LENGTH = 4000

export default async function createQuickbooksRefundReceipt(
  input: CreateRefundReceiptInput
): Promise<MappedRefundReceipt> {
  validateQbId(input.customerId, 'customerId')
  validateQbId(input.paidFromAccountId, 'paidFromAccountId')
  const Line = buildSalesItemLines(input.lines)
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
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/refundreceipt', credential, {
    method: 'POST',
    sandbox,
    requestId: input.requestId,
    body: {
      CustomerRef: { value: input.customerId },
      Line,
      DepositToAccountRef: { value: input.paidFromAccountId },
      ...(input.currency && { CurrencyRef: { value: input.currency } }),
      ...(input.txnDate && { TxnDate: input.txnDate }),
      ...(input.docNumber && { DocNumber: input.docNumber }),
      ...(input.privateNote && { PrivateNote: input.privateNote }),
    },
  })

  return mapRefundReceipt(result?.RefundReceipt)
}
