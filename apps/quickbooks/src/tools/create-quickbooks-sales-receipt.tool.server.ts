// src/tools/create-quickbooks-sales-receipt.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapSalesReceipt, type MappedSalesReceipt } from './shared/map-sales-receipt'
import { validateIsoDate, validateQbId } from './shared/qql-builder'
import { buildSalesItemLines, type SalesItemLineInput } from './shared/build-sales-lines'

interface CreateSalesReceiptInput {
  customerId: string
  lines: SalesItemLineInput[]
  depositToAccountId: string
  txnDate?: string
  docNumber?: string
  privateNote?: string
  currency?: string
  requestId?: string
}

const DOC_NUMBER_MAX_LENGTH = 21
const PRIVATE_NOTE_MAX_LENGTH = 4000

export default async function createQuickbooksSalesReceipt(
  input: CreateSalesReceiptInput
): Promise<MappedSalesReceipt> {
  // Validate and convert before touching the network: every one of these would
  // come back as an opaque 400 otherwise.
  validateQbId(input.customerId, 'customerId')
  validateQbId(input.depositToAccountId, 'depositToAccountId')
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
  const result = await quickbooksApi<any>(realmId, '/salesreceipt', credential, {
    method: 'POST',
    sandbox,
    // Intuit-guaranteed idempotence for a repeat delivery of THIS request.
    requestId: input.requestId,
    body: {
      CustomerRef: { value: input.customerId },
      Line,
      DepositToAccountRef: { value: input.depositToAccountId },
      ...(input.currency && { CurrencyRef: { value: input.currency } }),
      ...(input.txnDate && { TxnDate: input.txnDate }),
      ...(input.docNumber && { DocNumber: input.docNumber }),
      ...(input.privateNote && { PrivateNote: input.privateNote }),
    },
  })

  return mapSalesReceipt(result?.SalesReceipt)
}
