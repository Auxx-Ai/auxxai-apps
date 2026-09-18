// src/tools/shared/build-deposit-lines.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { toMajorUnits } from '../../blocks/quickbooks/shared/build-journal-lines'
import { validateQbId } from './qql-builder'

/**
 * One DepositLineDetail line. Amount is SIGNED — a payout's processor fee is a
 * negative line against an expense account, everything else is positive.
 */
export interface DepositLineInput {
  accountId: string
  /** Integer minor units (cents), signed. Negative for a fee line. */
  amountMinor: number
  memo?: string
}

/** Build `Line[]` of `DepositLineDetail` entries for create_quickbooks_deposit. */
export function buildDepositLines(lines: DepositLineInput[]): Record<string, unknown>[] {
  if (!lines.length) {
    throw new InvalidInputError('lines must contain at least one item.')
  }
  return lines.map((line, i) => {
    const where = `lines[${i}]`
    validateQbId(line.accountId, `${where}.accountId`)
    if (!Number.isInteger(line.amountMinor) || line.amountMinor === 0) {
      throw new InvalidInputError(
        `${where}.amountMinor must be a non-zero integer number of minor units (cents), got ${line.amountMinor}.`
      )
    }
    return {
      Amount: toMajorUnits(line.amountMinor),
      DetailType: 'DepositLineDetail' as const,
      ...(line.memo && { Memo: line.memo }),
      DepositLineDetail: {
        AccountRef: { value: line.accountId },
      },
    }
  })
}
