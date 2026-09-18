// src/tools/shared/build-expense-lines.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { toMajorUnits } from '../../blocks/quickbooks/shared/build-journal-lines'
import { validateQbId } from './qql-builder'

/** One AccountBasedExpenseLineDetail line, used by create_quickbooks_bill. */
export interface ExpenseLineInput {
  accountId: string
  /** Integer minor units (cents). 4999 means $49.99. */
  amountMinor: number
  description?: string
}

/**
 * Build `Line[]` of `AccountBasedExpenseLineDetail` entries — a Bill posts
 * straight to an expense/asset account, never through an Item.
 */
export function buildExpenseLines(lines: ExpenseLineInput[]): Record<string, unknown>[] {
  if (!lines.length) {
    throw new InvalidInputError('lines must contain at least one item.')
  }
  return lines.map((line, i) => {
    const where = `lines[${i}]`
    validateQbId(line.accountId, `${where}.accountId`)
    if (!Number.isInteger(line.amountMinor) || line.amountMinor <= 0) {
      throw new InvalidInputError(
        `${where}.amountMinor must be a positive integer number of minor units (cents), got ${line.amountMinor}.`
      )
    }
    return {
      Amount: toMajorUnits(line.amountMinor),
      DetailType: 'AccountBasedExpenseLineDetail' as const,
      ...(line.description && { Description: line.description }),
      AccountBasedExpenseLineDetail: {
        AccountRef: { value: line.accountId },
      },
    }
  })
}
