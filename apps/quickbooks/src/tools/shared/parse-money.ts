// src/tools/shared/parse-money.ts

import { InvalidInputError } from '@auxx/sdk/server'

/**
 * QuickBooks money, as a STRING.
 *
 * 🛑 The `\.\d{1,2}` alternative is not decoration: the General Ledger report
 * renders a zero-amount row's debit as `".00"`, with no leading zero (brief 20
 * §4.7, observed in the 2026-09-10 sandbox fixture). A pattern that demands a
 * leading digit turns that benign row into a refusal naming it.
 * {@link parseMoneyMinor} splits on `.` and `Number('')` is 0, so the missing
 * whole part already parses.
 */
const MONEY_RE = /^-?(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/

/**
 * Parse a QuickBooks money string into integer minor units, from the string
 * only, never through a float.
 *
 * `""` is zero - the 2026-06-30 balance-sheet sandbox run returned the Net
 * Income cell as the empty string, and the General Ledger report leaves the
 * unused side of every row empty by construction.
 *
 * One parser for every QuickBooks report, deliberately. It was widened once
 * for `".00"` (brief 20 §4.7) and a second copy would not have been.
 *
 * @param context what to name in the refusal, e.g. `Balance sheet row "Checking"`
 */
export function parseMoneyMinor(value: string, context: string): number {
  if (value === '') return 0
  if (!MONEY_RE.test(value)) {
    throw new InvalidInputError(`${context} has an unparseable amount: "${value}"`)
  }
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [wholePart, centsPart = ''] = unsigned.split('.')
  const cents = `${centsPart}00`.slice(0, 2)
  const minor = Number(wholePart) * 100 + Number(cents)
  return negative ? -minor : minor
}
