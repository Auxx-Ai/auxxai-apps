// src/tools/shared/build-sales-lines.ts

import { InvalidInputError } from '@auxx/sdk/server'
import { toMajorUnits } from '../../blocks/quickbooks/shared/build-journal-lines'
import { validateQbId } from './qql-builder'

/** One SalesItemLineDetail line, shared by SalesReceipt, CreditMemo and RefundReceipt. */
export interface SalesItemLineInput {
  itemId: string
  /** Integer minor units (cents). 4999 means $49.99. */
  amountMinor: number
  description?: string
  /** `NON` marks the sales-tax line so QuickBooks' automated sales tax does not recompute it. */
  taxCode?: 'NON'
}

/**
 * Build `Line[]` of `SalesItemLineDetail` entries from auxx-side minor-unit
 * lines. Shared by create_quickbooks_sales_receipt, create_quickbooks_credit_memo
 * and create_quickbooks_refund_receipt — all three post revenue-side items the
 * same way, differing only in the header fields around them.
 */
export function buildSalesItemLines(lines: SalesItemLineInput[]): Record<string, unknown>[] {
  if (!lines.length) {
    throw new InvalidInputError('lines must contain at least one item.')
  }
  return lines.map((line, i) => {
    const where = `lines[${i}]`
    validateQbId(line.itemId, `${where}.itemId`)
    if (!Number.isInteger(line.amountMinor) || line.amountMinor <= 0) {
      throw new InvalidInputError(
        `${where}.amountMinor must be a positive integer number of minor units (cents), got ${line.amountMinor}.`
      )
    }
    return {
      Amount: toMajorUnits(line.amountMinor),
      DetailType: 'SalesItemLineDetail' as const,
      ...(line.description && { Description: line.description }),
      SalesItemLineDetail: {
        ItemRef: { value: line.itemId },
        ...(line.taxCode === 'NON' && { TaxCodeRef: { value: 'NON' } }),
      },
    }
  })
}
