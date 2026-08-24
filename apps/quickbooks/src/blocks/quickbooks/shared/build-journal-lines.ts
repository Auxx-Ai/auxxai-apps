// src/blocks/quickbooks/shared/build-journal-lines.ts

import { InvalidInputError } from '@auxx/sdk/server'

/**
 * A journal entry line in AUXX terms: amount in integer MINOR UNITS.
 *
 * The whole point of this shape is that nothing upstream of `buildJournalLines`
 * ever handles a float. See `toMajorUnits` for why.
 */
export interface JournalLineInput {
  /** Integer minor units (cents). 4999 means $49.99. Must be a positive integer. */
  amountMinor: number
  postingType: 'Debit' | 'Credit'
  accountId: string
  accountName?: string
  description?: string
  /**
   * Required on a line posting to Accounts Receivable or Accounts Payable —
   * QBO cannot age a receivable it cannot attribute.
   */
  entity?: {
    type: 'Customer' | 'Vendor' | 'Employee'
    id: string
    name?: string
  }
}

/** QBO's wire shape. Amounts here are MAJOR units, which is the whole hazard. */
interface QboJournalLine {
  DetailType: 'JournalEntryLineDetail'
  Amount: number
  Description?: string
  JournalEntryLineDetail: {
    PostingType: 'Debit' | 'Credit'
    AccountRef: { value: string; name?: string }
    Entity?: {
      Type: 'Customer' | 'Vendor' | 'Employee'
      EntityRef: { value: string; name?: string }
    }
  }
}

const DESCRIPTION_MAX_LENGTH = 4000

/**
 * Convert integer minor units to the major-unit decimal QBO expects.
 *
 * This function is the single conversion point on purpose. `Workflow.currency`
 * is cents and QBO `Amount` is dollars, so a missed conversion inflates the
 * general ledger 100x — the same defect that stored 139 Shopify money rows 100x
 * low before it was caught. Division by 100 on an integer is exact for every
 * value in range; the rounding guards against a non-integer sneaking in.
 */
function toMajorUnits(amountMinor: number): number {
  return Math.round(amountMinor) / 100
}

/**
 * Build QBO `Line[]` from auxx-side lines, validating everything QBO would
 * reject anyway — but with a message that names the line.
 *
 * Deliberately NOT part of `shared/process-lines.ts`: that module knows only
 * `SalesItemLineDetail` / `*ExpenseLineDetail` and is shared by bill, estimate
 * and invoice. A journal entry line is a different shape with a different
 * required set, and widening the shared builder to carry both would put a
 * posting-type branch inside code that invoices depend on.
 *
 * @throws InvalidInputError when the lines cannot form a valid entry
 */
export function buildJournalLines(lines: JournalLineInput[]): QboJournalLine[] {
  if (lines.length < 2) {
    throw new InvalidInputError(
      `A journal entry needs at least two lines — one debit and one credit. Got ${lines.length}.`
    )
  }

  lines.forEach((line, i) => {
    const where = `Line ${i + 1}`
    if (!Number.isInteger(line.amountMinor)) {
      throw new InvalidInputError(
        `${where}: amountMinor must be an integer number of minor units (cents), got ${line.amountMinor}. A fractional cent cannot be posted.`
      )
    }
    // QBO rejects negative line amounts outright (error 2290 NegativeAmount);
    // direction is carried by PostingType alone, never by the sign.
    if (line.amountMinor <= 0) {
      throw new InvalidInputError(
        `${where}: amountMinor must be positive, got ${line.amountMinor}. Use postingType to set direction, not the sign.`
      )
    }
    if (!line.accountId) throw new InvalidInputError(`${where}: accountId is required.`)
    if (line.description && line.description.length > DESCRIPTION_MAX_LENGTH) {
      throw new InvalidInputError(
        `${where}: description exceeds ${DESCRIPTION_MAX_LENGTH} characters.`
      )
    }
  })

  // Balance is checked in INTEGER minor units. Doing this in floats either
  // rejects a valid entry or accepts one that is a cent out — and QBO answers
  // an imbalance with error 2300, which is a far worse place to discover it.
  const debits = sumMinor(lines, 'Debit')
  const credits = sumMinor(lines, 'Credit')
  if (debits !== credits) {
    throw new InvalidInputError(
      `Journal entry does not balance: debits ${formatMinor(debits)} vs credits ${formatMinor(credits)} (off by ${formatMinor(Math.abs(debits - credits))}).`
    )
  }
  if (debits === 0) {
    throw new InvalidInputError('Journal entry totals zero — nothing to post.')
  }

  return lines.map((line) => ({
    DetailType: 'JournalEntryLineDetail' as const,
    Amount: toMajorUnits(line.amountMinor),
    ...(line.description && { Description: line.description }),
    JournalEntryLineDetail: {
      PostingType: line.postingType,
      AccountRef: {
        value: line.accountId,
        ...(line.accountName && { name: line.accountName }),
      },
      // `Entity.Type` is documented "output only", yet every official sample
      // request carries it. The samples are the better evidence of what the
      // server accepts, so send it.
      ...(line.entity && {
        Entity: {
          Type: line.entity.type,
          EntityRef: {
            value: line.entity.id,
            ...(line.entity.name && { name: line.entity.name }),
          },
        },
      }),
    },
  }))
}

/** Sum one posting direction, in integer minor units. */
export function sumMinor(lines: JournalLineInput[], postingType: 'Debit' | 'Credit'): number {
  return lines
    .filter((l) => l.postingType === postingType)
    .reduce((total, l) => total + l.amountMinor, 0)
}

function formatMinor(amountMinor: number): string {
  return `${(amountMinor / 100).toFixed(2)}`
}
