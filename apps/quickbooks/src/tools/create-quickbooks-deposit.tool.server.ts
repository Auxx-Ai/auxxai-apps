// src/tools/create-quickbooks-deposit.tool.server.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { buildDepositLines, type DepositLineInput } from './shared/build-deposit-lines'
import { getQuickbooksConnection } from './shared/connection'
import { mapDeposit, type MappedDeposit } from './shared/map-deposit'
import { validateIsoDate, validateQbId } from './shared/qql-builder'

interface CreateDepositInput {
  depositToAccountId: string
  lines: DepositLineInput[]
  txnDate?: string
  privateNote?: string
  currency?: string
  requestId?: string
}

const PRIVATE_NOTE_MAX_LENGTH = 4000

/** Deposit has no DocNumber in QuickBooks, so there is nothing to validate or pass through here. */
export default async function createQuickbooksDeposit(
  input: CreateDepositInput
): Promise<MappedDeposit> {
  validateQbId(input.depositToAccountId, 'depositToAccountId')
  const Line = buildDepositLines(input.lines)
  if (input.currency && !/^[A-Z]{3}$/.test(input.currency)) {
    throw new InvalidInputError('currency must be a three-letter ISO code.')
  }
  if (input.privateNote && input.privateNote.length > PRIVATE_NOTE_MAX_LENGTH) {
    throw new InvalidInputError(
      `privateNote must be at most ${PRIVATE_NOTE_MAX_LENGTH} characters.`
    )
  }
  if (input.txnDate) validateIsoDate(input.txnDate, 'txnDate')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/deposit', credential, {
    method: 'POST',
    sandbox,
    requestId: input.requestId,
    body: {
      DepositToAccountRef: { value: input.depositToAccountId },
      Line,
      ...(input.currency && { CurrencyRef: { value: input.currency } }),
      ...(input.txnDate && { TxnDate: input.txnDate }),
      ...(input.privateNote && { PrivateNote: input.privateNote }),
    },
  })

  return mapDeposit(result?.Deposit)
}
