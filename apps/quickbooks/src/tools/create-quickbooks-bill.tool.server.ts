// src/tools/create-quickbooks-bill.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { buildExpenseLines, type ExpenseLineInput } from './shared/build-expense-lines'
import { getQuickbooksConnection } from './shared/connection'
import { mapBill, type MappedBill } from './shared/map-bill'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface CreateBillInput {
  vendorId: string
  lines: ExpenseLineInput[]
  dueDate?: string
  txnDate?: string
  docNumber?: string
  privateNote?: string
  currency?: string
  requestId?: string
}

const DOC_NUMBER_MAX_LENGTH = 21
const PRIVATE_NOTE_MAX_LENGTH = 4000

export default async function createQuickbooksBill(input: CreateBillInput): Promise<MappedBill> {
  validateQbId(input.vendorId, 'vendorId')
  const Line = buildExpenseLines(input.lines)
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
  if (input.dueDate) validateIsoDate(input.dueDate, 'dueDate')
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/bill', credential, {
    method: 'POST',
    sandbox,
    requestId: input.requestId,
    body: {
      VendorRef: { value: input.vendorId },
      Line,
      ...(input.currency && { CurrencyRef: { value: input.currency } }),
      ...(input.txnDate && { TxnDate: input.txnDate }),
      ...(input.dueDate && { DueDate: input.dueDate }),
      ...(input.docNumber && { DocNumber: input.docNumber }),
      ...(input.privateNote && { PrivateNote: input.privateNote }),
    },
  })

  return mapBill(result?.Bill)
}
