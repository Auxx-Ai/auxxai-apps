// tests/settlement-evidence.test.ts
//
// The arithmetic is NOT re-checked here. Every assertion about whether a row is
// acceptable runs the PLATFORM's own code — `payoutEvidenceEnvelopeSchema`,
// `processorBalanceEvidenceSchema`, `exactEvidenceMinor` and
// `assessPayoutMembership` from `packages/lib/src/money/payouts/evidence-contracts.ts`,
// imported across the repo boundary via a vitest alias (see `vitest.config.ts`).
// A copy of that file would drift; this cannot.
//
// Fixtures marked REAL are VERBATIM rows from the PUBLIC API, probed live on
// 2026-09-16 (`plans/apps/affirm/probe-public-api-2026-09-16.md`). Where the
// probe still did not observe something — a refund, a fee row, a dispute, a
// removal state, an event belonging to no deposit — the fixture is marked
// SYNTHETIC and keeps the observed vocabulary and magnitudes.

import {
  assessPayoutMembership,
  exactEvidenceMinor,
  payoutEvidenceEnvelopeSchema,
  processorActivityKindSchema,
  processorBalanceEvidenceSchema,
} from '@auxx/lib/money/payouts/evidence-contracts'
import { describe, expect, it } from 'vitest'
import {
  AFFIRM_DEFAULT_CURRENCY,
  AFFIRM_SETTLEMENT_MONEY_UNITS,
  type AffirmProcessorEvidence,
  type AffirmSettlementEvent,
  type AffirmSettlementSummary,
  affirmActivityKind,
  affirmMinor,
  evidenceAmount,
  payoutEvidence,
  processorEvidence,
} from '../src/settlement-evidence'

// ---------------------------------------------------------------------------
// The contract boundary
// ---------------------------------------------------------------------------

/**
 * Drop `providerType` before a literal schema parse.
 *
 * `processorBalanceEvidenceSchema` is `.strict()` and does not declare
 * `providerType`, which the translation carries for the same reason the Shopify
 * app's `balanceEvidence` does: the provider's own word for the activity, beside
 * the mapped kind. A key is removed here; no rule is re-implemented.
 */
function contractEntry(entry: AffirmProcessorEvidence) {
  const { providerType, ...rest } = entry
  void providerType
  return rest
}

/** Validate one entry with the platform's own schema. */
function parseEntry(entry: AffirmProcessorEvidence) {
  return processorBalanceEvidenceSchema.parse(contractEntry(entry))
}

const SOURCE_ACCOUNT = { externalAccountId: '07JVNWWI5PZM8L7Y', environment: 'live' as const }

function envelope(
  summary: AffirmSettlementSummary,
  events: AffirmSettlementEvent[],
  membership: { complete?: boolean; providerReady?: boolean; reason?: string | null } = {}
) {
  const payout = payoutEvidence(summary)
  const entries = events
    .map((event) => processorEvidence(event, { currency: payout.currency }))
    .map(contractEntry)
  return {
    version: 1 as const,
    sourceAccount: SOURCE_ACCOUNT,
    payout,
    membership: {
      complete: membership.complete ?? true,
      providerReady: membership.providerReady ?? true,
      reason: membership.reason ?? null,
      entries,
    },
  }
}

/** Parse with the platform schema, then assess with the platform assessor. */
function assess(input: ReturnType<typeof envelope>) {
  return assessPayoutMembership(payoutEvidenceEnvelopeSchema.parse(input))
}

// ---------------------------------------------------------------------------
// Fixtures — the live public API, 2026-09-16
// ---------------------------------------------------------------------------
//
// ⚠️ The arithmetic every REAL fixture below pins, and the one the first
// implementation got wrong: `total_settled == sales + fees`, EXACTLY, with
// `transaction_fees` outside it entirely. `fees` is the WHOLE fee and
// `transaction_fees` is a component breakdown OF it. The CSV export disagrees —
// it splits the same money into `fees` (-160.45) and `txn_fees` (-0.30) that sum
// to the API's single `fees` (-16075) — and adding the two here double-counts
// 30 cents an event while still balancing, so nothing downstream would catch it.

/** REAL. `GET /settlements/daily`, the 2026-09-15 deposit, verbatim. */
const SEP15_SUMMARY: AffirmSettlementSummary = {
  total_settled: 357930,
  currency: 'USD',
  total_fees: -16075,
  date: '2026-09-15',
  account_last_four: '6670',
  total_refunds: 0,
  total_sales: 374005,
  deposit_id: 'I5Y8PHAWWSSS2WJ',
  id: 'a28fbb9b-2f7c-4880-a938-3ed6d32709d8',
}

/**
 * REAL. `GET /settlements/events`, the ONE event of that deposit, verbatim.
 *
 * `sales 374005 + fees -16075 = total_settled 357930`. The `transaction_fees:
 * -30` is part of that `-16075`, not another 30 cents.
 */
const SEP15_EVENT: AffirmSettlementEvent = {
  order_id: 'rPhjzMna9vESRYlOF0hLADbBL',
  merchant_id: '07JVNWWI5PZM8L7Y',
  channel: 'Affirm Direct',
  deposit_id: 'I5Y8PHAWWSSS2WJ',
  initiating_merchant_id: '07JVNWWI5PZM8L7Y',
  mdr: 0.0429,
  date: '2026-09-15',
  total_settled: 357930,
  effective_date: '2026-09-14T19:28:14Z',
  id: '53f9cad7-b293-4918-b7d4-6716c64e21de',
  transaction_id: 'oTzSBZG2TU5WGc28',
  event_type: 'loan_capture',
  transaction_fees: -30,
  original_loan_amount: 374005,
  sales: 374005,
  charge_created_date: '2026-09-14',
  refunds: 0,
  transaction_event_id: 'DUUX0OUUPNABFT9G',
  fees: -16075,
  purchase_id: 'CPDZ-ANRU',
  currency: 'USD',
}

/** REAL. `GET /settlements/daily`, the 2026-09-03 deposit — a MULTI-event one. */
const SEP03_SUMMARY: AffirmSettlementSummary = {
  total_settled: 1055350,
  currency: 'USD',
  total_fees: -47399,
  date: '2026-09-03',
  account_last_four: '6670',
  total_refunds: 0,
  total_sales: 1102749,
  deposit_id: '3KIMO82WVXDZ6J9',
  id: '99680067-bd1a-492d-9eda-0740fb70a621',
}

/**
 * REAL. The three events of deposit `3KIMO82WVXDZ6J9`, verbatim — a genuine
 * multi-event deposit, which the earlier portal probe never managed to observe.
 *
 * Σsales 1102749, Σfees -47399, Σtotal_settled 1055350: its header exactly.
 */
const SEP03_EVENTS: AffirmSettlementEvent[] = [
  {
    order_id: 'rauWYononuS2HihiLhrBS7i8V',
    merchant_id: '07JVNWWI5PZM8L7Y',
    channel: 'Affirm Direct',
    deposit_id: '3KIMO82WVXDZ6J9',
    initiating_merchant_id: '07JVNWWI5PZM8L7Y',
    mdr: 0.0429,
    date: '2026-09-03',
    total_settled: 336619,
    effective_date: '2026-09-02T01:35:46Z',
    id: 'be142842-bfec-41c0-9095-b5442dd02137',
    transaction_id: 'R8LaQM01oa5ow8XO',
    event_type: 'loan_capture',
    transaction_fees: -30,
    original_loan_amount: 351739,
    sales: 351739,
    charge_created_date: '2026-09-02',
    refunds: 0,
    transaction_event_id: 'YWWC2HWEY94W6ZCS',
    fees: -15120,
    purchase_id: '5IHA-T2T3',
    currency: 'USD',
  },
  {
    order_id: 'rGSfflawZ9aLTCYG7Z88LZSel',
    merchant_id: '07JVNWWI5PZM8L7Y',
    channel: 'Affirm Direct',
    deposit_id: '3KIMO82WVXDZ6J9',
    initiating_merchant_id: '07JVNWWI5PZM8L7Y',
    mdr: 0.0429,
    date: '2026-09-03',
    total_settled: 489466,
    effective_date: '2026-09-02T02:22:35Z',
    id: '9ca4d468-724a-40a2-9b90-e85afbb1b5a5',
    transaction_id: 'jtFhUiMlF0v5zKBJ',
    event_type: 'loan_capture',
    transaction_fees: -30,
    original_loan_amount: 511437,
    sales: 511437,
    charge_created_date: '2026-09-02',
    refunds: 0,
    transaction_event_id: 'R8SIDCBYAQPGG1UA',
    fees: -21971,
    purchase_id: 'HZUZ-IPJ4',
    currency: 'USD',
  },
  {
    order_id: 'rJqB4wVtIBs7llboIwAI907WL',
    merchant_id: '07JVNWWI5PZM8L7Y',
    channel: 'Affirm Direct',
    deposit_id: '3KIMO82WVXDZ6J9',
    initiating_merchant_id: '07JVNWWI5PZM8L7Y',
    mdr: 0.0429,
    date: '2026-09-03',
    total_settled: 229265,
    effective_date: '2026-09-02T20:15:42Z',
    id: '23ce6f71-69ba-4b10-ac97-209a81b60b79',
    transaction_id: 'j4zQE9rn9AaJjAYk',
    event_type: 'loan_capture',
    transaction_fees: -30,
    original_loan_amount: 239573,
    sales: 239573,
    charge_created_date: '2026-09-02',
    refunds: 0,
    transaction_event_id: 'IB4A6ARIIGWN1N5I',
    fees: -10308,
    purchase_id: 'N72T-JFL6',
    currency: 'USD',
  },
]

/** Every REAL event fixture, for the properties that must hold on all of them. */
const REAL_EVENTS: [string, AffirmSettlementEvent][] = [
  ['Sep-15 I5Y8PHAWWSSS2WJ', SEP15_EVENT],
  ['Sep-03 #1', SEP03_EVENTS[0]!],
  ['Sep-03 #2', SEP03_EVENTS[1]!],
  ['Sep-03 #3', SEP03_EVENTS[2]!],
]

/**
 * SYNTHETIC. The REAL Sep-15 event's money restated in decimal dollars, so the
 * other setting of {@link AFFIRM_SETTLEMENT_MONEY_UNITS} stays exercised.
 *
 * ⚠️ This is the API's row in decimal form — NOT the CSV export's row. The CSV
 * writes the same money as `fees -160.45` PLUS `txn_fees -0.30`; transcribing
 * that split here and summing it is precisely the double count the mapping was
 * fixed to stop, so the whole fee lives in `fees` as the API states it.
 */
const SEP15_EVENT_DECIMAL: AffirmSettlementEvent = {
  ...SEP15_EVENT,
  sales: 3740.05,
  refunds: 0.0,
  fees: -160.75,
  transaction_fees: -0.3,
  total_settled: 3579.3,
}

describe('the real Sep-15 deposit', () => {
  it('transcribes the payout header', () => {
    expect(payoutEvidence(SEP15_SUMMARY)).toMatchObject({
      id: 'I5Y8PHAWWSSS2WJ',
      status: 'paid',
      amount: '3579.30',
      currency: 'USD',
      currencyExponent: 2,
      issuedAt: null,
      issuedOn: '2026-09-15',
      // REAL now: the public API sends `account_last_four`, which the portal's
      // settlement JSON did not.
      destinationExternalId: '6670',
    })
  })

  it('derives a positive fee and a gross that satisfies the contract identity', () => {
    const entry = processorEvidence(SEP15_EVENT)
    expect(entry).toMatchObject({
      id: '53f9cad7-b293-4918-b7d4-6716c64e21de',
      type: 'charge',
      // The PUBLIC API's spelling. The portal's report says `loan_captured`.
      providerType: 'loan_capture',
      // fee = -(-16075) = 160.75, POSITIVE, as the contract requires. The
      // event's `transaction_fees: -30` is a component OF that -16075 and is
      // NOT added: -(-16075 + -30) would be 161.05.
      fee: '160.75',
      net: '3579.30',
      gross: '3740.05',
      currency: 'USD',
      currencyExponent: 2,
      // `effective_date`, not the date-only settlement `date`.
      transactionDate: '2026-09-14T19:28:14Z',
      payoutId: 'I5Y8PHAWWSSS2WJ',
      sourceTransactionId: 'oTzSBZG2TU5WGc28',
      sourceOrderId: 'rPhjzMna9vESRYlOF0hLADbBL',
      sourceId: 'CPDZ-ANRU',
      sourceType: null,
    })
    // The provider row survives untouched, `mdr` included — and `mdr` is not a
    // mapped field anywhere on the entry.
    expect(entry.raw).toBe(SEP15_EVENT)
    expect(entry).not.toHaveProperty('mdr')
  })

  it('reconciles under the platform assessor with no reasons', () => {
    const result = assess(envelope(SEP15_SUMMARY, [SEP15_EVENT]))
    expect(result.state).toBe('complete')
    expect(result.reason).toBeNull()
    expect(result.constituentNetMinor).toBe(357930n)
    expect(result.differenceMinor).toBe(0n)
  })

  it('reconciles the real multi-event Sep-03 deposit too', () => {
    const result = assess(envelope(SEP03_SUMMARY, SEP03_EVENTS))
    expect(result.state).toBe('complete')
    expect(result.reason).toBeNull()
    // 336619 + 489466 + 229265, the three real events, against the header.
    expect(result.constituentNetMinor).toBe(1055350n)
    expect(result.differenceMinor).toBe(0n)
  })
})

describe('the derived gross', () => {
  // This is the guard the build plan §4.1 asks for, and since the fee formula
  // was corrected it is an EXACT identity rather than an approximate agreement:
  // `gross` is DERIVED as `net + fee`, so the contract identity holds by
  // construction, and on every live row that derivation lands precisely on
  // Affirm's own `sales + refunds`. Not within a cent — on it.
  //
  // That exactness is the point. Under the old `-(fees + transaction_fees)`
  // formula the derived gross was 30 cents high on every single one of these
  // rows and still balanced, so only this comparison against Affirm's OWN
  // reported figures could ever have caught it. It is the drift detector: the
  // TEST fails if Affirm changes, not the mapping.
  it.each(REAL_EVENTS)('equals sales + refunds exactly on real fixture data (%s)', (_l, event) => {
    const entry = processorEvidence(event)
    const reported = affirmMinor(event.sales, 2, 'minor') + affirmMinor(event.refunds, 2, 'minor')
    expect(entry.gross).toBe(evidenceAmount(reported, 2))
    // And the other half of the same identity, on the untouched provider row:
    // `total_settled == sales + fees`, with `transaction_fees` outside it.
    expect(affirmMinor(event.total_settled, 2, 'minor')).toBe(
      affirmMinor(event.sales, 2, 'minor') + affirmMinor(event.fees, 2, 'minor')
    )
  })

  it('holds on the decimal restatement of the same row', () => {
    const entry = processorEvidence(SEP15_EVENT_DECIMAL, { units: 'decimal' })
    const reported =
      affirmMinor(SEP15_EVENT_DECIMAL.sales, 2, 'decimal') +
      affirmMinor(SEP15_EVENT_DECIMAL.refunds, 2, 'decimal')
    expect(entry.gross).toBe(evidenceAmount(reported, 2))
  })
})

describe('units', () => {
  it('produces identical contract output from cents and from decimals', () => {
    const fromCents = processorEvidence(SEP15_EVENT, { units: 'minor' })
    const fromDecimals = processorEvidence(SEP15_EVENT_DECIMAL, { units: 'decimal' })
    expect(fromDecimals.gross).toBe(fromCents.gross)
    expect(fromDecimals.fee).toBe(fromCents.fee)
    expect(fromDecimals.net).toBe(fromCents.net)
  })

  it('defaults to the minor-unit reading of the public API', () => {
    // ✔ Observed, not reasoned: every amount on both live endpoints came back
    // as an integer count of cents (`357930`, `-16075`).
    expect(AFFIRM_SETTLEMENT_MONEY_UNITS).toBe('minor')
    expect(processorEvidence(SEP15_EVENT).net).toBe('3579.30')
  })

  it('round-trips through the platform converter without floating point', () => {
    for (const amount of ['3579.30', '160.75', '-160.75', '0.00', '123456789012345.67']) {
      expect(evidenceAmount(exactEvidenceMinor(amount, 'USD', 2), 2)).toBe(amount)
    }
    // A value past Number.MAX_SAFE_INTEGER survives, which `value / 100` could
    // not: 12345678901234567 / 100 is 123456789012345.67 only by luck of
    // formatting, and the integer itself is already lossy as a double.
    expect(evidenceAmount(affirmMinor('12345678901234567', 2, 'minor'), 2)).toBe(
      '123456789012345.67'
    )
  })

  it('refuses exponent notation and over-precise decimals rather than parsing them', () => {
    expect(() => affirmMinor(1e21, 2, 'decimal')).toThrow(/invalid decimal/)
    expect(() => affirmMinor('3579.301', 2, 'decimal')).toThrow(/finer than 2 decimal places/)
    expect(() => affirmMinor('3579.30', 2, 'minor')).toThrow(/non-integer minor-unit/)
    expect(() => affirmMinor(undefined, 2, 'minor')).toThrow(/missing or non-numeric/)
  })
})

describe('event_type mapping', () => {
  it('accepts both the documented and the emitted spelling', () => {
    // Affirm uses BOTH, on two surfaces: the PUBLIC API emits `loan_capture`
    // (9/9 events, 2026-09-16) and the merchant portal's settlement report
    // emits `loan_captured`. Both must land on `charge`.
    expect(affirmActivityKind('loan_capture')).toBe('charge')
    expect(affirmActivityKind('loan_captured')).toBe('charge')
    expect(affirmActivityKind('split_capture')).toBe('charge')
    expect(affirmActivityKind('split_captured')).toBe('charge')
    expect(affirmActivityKind('loan_refund')).toBe('refund')
    expect(affirmActivityKind('loan_refunded')).toBe('refund')
  })

  it('maps the rest of the documented vocabulary', () => {
    expect(affirmActivityKind('partial_void')).toBe('refund')
    expect(affirmActivityKind('refund_voided')).toBe('adjustment')
    expect(affirmActivityKind('merchant_fee')).toBe('fee')
    expect(affirmActivityKind('fee_adjustment')).toBe('fee')
    // There is NO dispute kind in the closed platform enum.
    expect(affirmActivityKind('dispute_opened')).toBe('adjustment')
    expect(affirmActivityKind('dispute_resolved')).toBe('adjustment')
    expect(affirmActivityKind('vcn_balance_adjustment')).toBe('adjustment')
  })

  it('never emits a kind the platform enum does not declare', () => {
    const types = [
      'loan_capture',
      'loan_captured',
      'split_capture',
      'split_captured',
      'loan_refund',
      'loan_refunded',
      'partial_void',
      'refund_voided',
      'merchant_fee',
      'fee_adjustment',
      'dispute_opened',
      'dispute_resolved',
      'vcn_balance_adjustment',
      'something_affirm_ships_next_year',
    ]
    for (const type of types) {
      expect(() => processorActivityKindSchema.parse(affirmActivityKind(type))).not.toThrow()
    }
  })

  it('falls back to unknown, and keeps the raw spelling visible', () => {
    const entry = processorEvidence({ ...SEP15_EVENT, event_type: 'loan_rebooked' })
    expect(entry.type).toBe('unknown')
    expect(entry.providerType).toBe('loan_rebooked')
  })

  it('rejects an event with no event_type at all', () => {
    expect(() => processorEvidence({ ...SEP15_EVENT, event_type: undefined })).toThrow(
      /no event type/
    )
  })
})

describe('the real multi-event deposit', () => {
  // REAL. Deposit `3KIMO82WVXDZ6J9`, three live `loan_capture` events. The
  // earlier portal probe never saw a deposit with more than one event, so this
  // group used to be synthetic; it is not any more.

  it('sums its three real events to the transcribed deposit amount', () => {
    const result = assess(envelope(SEP03_SUMMARY, SEP03_EVENTS))
    expect(result.state).toBe('complete')
    expect(result.constituentNetMinor).toBe(1055350n)
    expect(result.differenceMinor).toBe(0n)
  })

  it('translates each member with its own fee, never the deposit total', () => {
    const entries = SEP03_EVENTS.map((event) => processorEvidence(event))
    expect(entries.map((entry) => entry.fee)).toEqual(['151.20', '219.71', '103.08'])
    expect(entries.map((entry) => entry.net)).toEqual(['3366.19', '4894.66', '2292.65'])
    expect(entries.map((entry) => entry.gross)).toEqual(['3517.39', '5114.37', '2395.73'])
    // Each member's own occurrence time, all on 2026-09-02 — the day BEFORE the
    // deposit settled. This is why `effective_date` is preferred over `date`.
    expect(entries.map((entry) => entry.transactionDate)).toEqual([
      '2026-09-02T01:35:46Z',
      '2026-09-02T02:22:35Z',
      '2026-09-02T20:15:42Z',
    ])
    for (const entry of entries) expect(parseEntry(entry)).toBeTruthy()
  })

  it('rejects a duplicated entry identity', () => {
    const [first, second, third] = SEP03_EVENTS
    const result = assess(envelope(SEP03_SUMMARY, [first!, { ...second!, id: first!.id }, third!]))
    expect(result.state).toBe('incomplete')
    expect(result.reason).toContain('Duplicate processor entry identity')
  })
})

describe('a refund, which no probe has yet observed', () => {
  // SYNTHETIC throughout. Every refund either probe saw was 0.00, so the signs
  // below are INFERRED. Magnitudes and the fee rate (4.29%) follow the real
  // rows, and the deposit is made internally consistent with the same identity
  // the real ones satisfy: `total_settled == sales + refunds + fees`.
  const summary: AffirmSettlementSummary = {
    deposit_id: 'QK3M7RZT9WPLBDV',
    date: '2026-09-22',
    total_sales: 500000,
    total_refunds: -120000,
    total_fees: -16310,
    total_settled: 363690,
    currency: 'USD',
    account_last_four: '6670',
  }
  const capture: AffirmSettlementEvent = {
    id: 'EVT7Q2XN4KRM8TCA',
    deposit_id: 'QK3M7RZT9WPLBDV',
    date: '2026-09-22',
    effective_date: '2026-09-21T14:02:11Z',
    order_id: 'aB7kLmQ2rXvT9nPzYsE4dWc1H',
    transaction_id: 'kP4mXt82RlQnZa17',
    purchase_id: 'RTQL-8WNZ',
    event_type: 'loan_capture',
    sales: 500000,
    refunds: 0,
    fees: -21450,
    transaction_fees: -30,
    total_settled: 478550,
    currency: 'USD',
  }
  const refund: AffirmSettlementEvent = {
    id: 'EVT2D9HB6VNQ3XZM',
    deposit_id: 'QK3M7RZT9WPLBDV',
    date: '2026-09-22',
    effective_date: '2026-09-21T16:40:09Z',
    order_id: 'zR8pNqW3tYu6vCx2MbK9sLd7J',
    transaction_id: 'wQ6nYb31TkLpMz08',
    purchase_id: 'BNKD-2QVR',
    event_type: 'loan_refund',
    sales: 0,
    // ⚠️ Refund sign is INFERRED from the fee sign. The fee rebate is positive
    // here, the refund negative.
    refunds: -120000,
    fees: 5140,
    transaction_fees: -8,
    total_settled: -114860,
    currency: 'USD',
  }

  it('sums to the transcribed deposit amount under the platform assessor', () => {
    const result = assess(envelope(summary, [capture, refund]))
    expect(result.state).toBe('complete')
    expect(result.constituentNetMinor).toBe(363690n)
    expect(result.differenceMinor).toBe(0n)
  })

  it('keeps the refund negative and its fee rebate negative-as-fee', () => {
    const entry = processorEvidence(refund)
    expect(entry.type).toBe('refund')
    expect(entry.net).toBe('-1148.60')
    // fee = -(5140) = -5140 minor — the `transaction_fees: -8` is NOT netted
    // in. A rebate is a NEGATIVE fee, and the identity still holds:
    // -1200.00 - (-51.40) = -1148.60.
    expect(entry.fee).toBe('-51.40')
    expect(entry.gross).toBe('-1200.00')
    expect(parseEntry(entry)).toBeTruthy()
  })
})

describe('entries that are not a charge', () => {
  // SYNTHETIC: no `merchant_fee` row was observed by either probe. It also
  // carries no `currency`, which is the one case the USD fallback still exists
  // for — the live API sent a currency on all 9/9 events.
  const merchantFee: AffirmSettlementEvent = {
    id: 'EVT5F1LK7PWQ2RNB',
    deposit_id: 'I5Y8PHAWWSSS2WJ',
    date: '2026-09-15',
    event_type: 'merchant_fee',
    sales: 0,
    refunds: 0,
    fees: -2500,
    total_settled: -2500,
  }

  it('maps a merchant fee with no order to a standalone fee entry', () => {
    const entry = processorEvidence(merchantFee)
    expect(entry).toMatchObject({
      type: 'fee',
      providerType: 'merchant_fee',
      gross: '0.00',
      fee: '25.00',
      net: '-25.00',
      sourceOrderId: null,
      sourceTransactionId: null,
      sourceId: null,
    })
    expect(parseEntry(entry)).toBeTruthy()
  })

  it('counts a fee row toward the deposit total', () => {
    // SYNTHETIC deposit: the Sep-15 capture minus a $25 platform fee.
    const summary = { ...SEP15_SUMMARY, deposit_id: 'FEE9TRQ2MWXZK4B', total_settled: 355430 }
    const events = [
      { ...SEP15_EVENT, deposit_id: 'FEE9TRQ2MWXZK4B' },
      { ...merchantFee, deposit_id: 'FEE9TRQ2MWXZK4B' },
    ]
    const result = assess(envelope(summary, events))
    expect(result.state).toBe('complete')
    expect(result.constituentNetMinor).toBe(355430n)
  })

  it('maps dispute_opened to adjustment, because the enum has no dispute kind', () => {
    // SYNTHETIC: no dispute was observed by either probe.
    const entry = processorEvidence({
      id: 'EVT8C3JR5TMQ1WKD',
      deposit_id: 'I5Y8PHAWWSSS2WJ',
      date: '2026-09-15',
      order_id: 'rPhjzMna9vESRYlOF0hLADbBL',
      event_type: 'dispute_opened',
      sales: 0,
      refunds: -374005,
      fees: 0,
      total_settled: -374005,
    })
    expect(entry.type).toBe('adjustment')
    expect(entry.providerType).toBe('dispute_opened')
    expect(entry.fee).toBe('0.00')
    expect(entry.gross).toBe('-3740.05')
    expect(parseEntry(entry)).toBeTruthy()
  })

  it('marks a deposit carrying an unknown event type unsupported, not short', () => {
    const summary = { ...SEP15_SUMMARY, deposit_id: 'UNK4PZWR8TMQ3XV' }
    const events = [
      { ...SEP15_EVENT, deposit_id: 'UNK4PZWR8TMQ3XV' },
      {
        id: 'EVT6M2QZ9XKR4TPL',
        deposit_id: 'UNK4PZWR8TMQ3XV',
        date: '2026-09-15',
        event_type: 'loan_rebooked',
        total_settled: 0,
      },
    ]
    const result = assess(envelope(summary, events))
    expect(result.state).toBe('unsupported')
    expect(result.reason).toContain('requires separate activity assessment')
    expect(result.constituentNetMinor).toBeNull()
  })
})

describe('events with no deposit', () => {
  // SYNTHETIC: every one of the nine live events carried a `deposit_id`. The
  // shape is nonetheless expected — `/settlements/events` is a flat feed and
  // build plan §3.4 rule 3 requires these to be emitted — so the fixture is
  // kept, made consistent with the real arithmetic (`total_settled == sales +
  // fees`, `transaction_fees` outside it).
  const orphan: AffirmSettlementEvent = {
    id: 'EVT3N8VQ2WKR7ZXM',
    date: '2026-09-16',
    effective_date: '2026-09-16T11:04:52Z',
    order_id: 'mT5wQx9LpVn2KsY8dBc3RfZ1H',
    transaction_id: 'nV9qKz47WmLtRx26',
    transaction_event_id: 'TXE-9QRW-2ZKM',
    event_type: 'loan_capture',
    sales: 129900,
    refunds: 0,
    fees: -5573,
    transaction_fees: -30,
    total_settled: 124327,
    currency: 'USD',
  }

  it('emits a null payoutId instead of dropping the entry', () => {
    const entry = processorEvidence(orphan)
    expect(entry.payoutId).toBeNull()
    // `transaction_event_id` is the fallback for `sourceId` when there is no
    // `purchase_id`.
    expect(entry.sourceId).toBe('TXE-9QRW-2ZKM')
    expect(parseEntry(entry)).toBeTruthy()
  })

  it('is flagged by the assessor if it is wrongly placed inside a payout', () => {
    const result = assess(envelope(SEP15_SUMMARY, [SEP15_EVENT, orphan]))
    expect(result.reason).toContain('belongs to another payout or is unassigned')
  })
})

describe('the payout header', () => {
  it('carries a removal_state through as the status', () => {
    // SYNTHETIC: no removal state was observed by either probe.
    const failed = payoutEvidence({ ...SEP15_SUMMARY, removal_state: 'failed' })
    expect(failed.status).toBe('failed')
    const rejected = payoutEvidence({ ...SEP15_SUMMARY, removal_state: 'rejected' })
    expect(rejected.status).toBe('rejected')
  })

  it('still parses and assesses when the deposit failed', () => {
    const result = assess(envelope({ ...SEP15_SUMMARY, removal_state: 'failed' }, [SEP15_EVENT]))
    expect(result.state).toBe('complete')
  })

  it('falls back to USD and null bank digits when Affirm omits them', () => {
    // SYNTHETIC omission. The live API sent both on every daily row; this is
    // the last-resort path, not the normal one.
    const { currency, account_last_four, ...bare } = SEP15_SUMMARY
    void currency
    void account_last_four
    const payout = payoutEvidence(bare)
    expect(payout.currency).toBe('USD')
    expect(payout.destinationExternalId).toBeNull()
  })

  it('rejects a summary with no deposit id or an invalid date', () => {
    expect(() => payoutEvidence({ ...SEP15_SUMMARY, deposit_id: '' })).toThrow(
      /missing or unsafe identifier/
    )
    expect(() => payoutEvidence({ ...SEP15_SUMMARY, date: '2026-09-31' })).toThrow(
      /invalid settlement date/
    )
    expect(() => payoutEvidence({ ...SEP15_SUMMARY, date: '09/15/2026' })).toThrow(
      /invalid settlement date/
    )
  })

  it('reports incomplete membership rather than a short answer', () => {
    const result = assess(
      envelope(SEP15_SUMMARY, [], {
        complete: false,
        reason: 'Affirm settlement event window has not finished paging',
      })
    )
    expect(result.state).toBe('incomplete')
    expect(result.reason).toContain('has not finished paging')
  })
})

describe('currency', () => {
  // The probe found `currency` on 9/9 settlement events and on EVERY daily row,
  // so the USD fallback is now a last resort that live data never reaches. The
  // row's own value is the truth and must win over anything a caller supplies.

  it("prefers the row's own currency over the caller's and over the default", () => {
    expect(
      processorEvidence({ ...SEP15_EVENT, currency: 'CAD' }, { currency: 'GBP' }).currency
    ).toBe('CAD')
    expect(
      payoutEvidence({ ...SEP15_SUMMARY, currency: 'CAD' }, { currency: 'GBP' }).currency
    ).toBe('CAD')
  })

  it('takes USD from the real rows themselves, not from the fallback', () => {
    // Hand every real fixture a WRONG caller currency. If any of them came back
    // as GBP, the row's own value was being ignored; if the constant were the
    // source, changing it would change the answer. Neither is true.
    for (const [, event] of REAL_EVENTS) {
      expect(event.currency).toBe('USD')
      expect(processorEvidence(event, { currency: 'GBP' }).currency).toBe('USD')
    }
    for (const summary of [SEP15_SUMMARY, SEP03_SUMMARY]) {
      expect(summary.currency).toBe('USD')
      expect(payoutEvidence(summary, { currency: 'GBP' }).currency).toBe('USD')
    }
  })

  it('normalises the case Affirm sends it in, and refuses a non-currency', () => {
    expect(processorEvidence({ ...SEP15_EVENT, currency: 'usd' }).currency).toBe('USD')
    expect(() => processorEvidence({ ...SEP15_EVENT, currency: 'DOLLARS' })).toThrow(
      /invalid settlement currency/
    )
  })

  it('reaches the fallback only when the row carries nothing', () => {
    const { currency, ...bare } = SEP15_EVENT
    void currency
    expect(processorEvidence(bare).currency).toBe(AFFIRM_DEFAULT_CURRENCY)
    // ...and the caller still outranks the constant on that path.
    expect(processorEvidence(bare, { currency: 'CAD' }).currency).toBe('CAD')
  })
})

describe('transactionDate', () => {
  // `date` is the SETTLEMENT date and is date-only; `effective_date` is an
  // offset-bearing timestamp of when the capture actually happened. The
  // contract wants an offset-bearing datetime and means the entry's own
  // occurrence time — Shopify's equivalent maps `processed_at` — so
  // `effective_date` is preferred. The deposit's date is not lost: it is the
  // payout header's `issuedOn`.

  it('prefers effective_date, the occurrence time, over the settlement date', () => {
    const entry = processorEvidence(SEP15_EVENT)
    expect(SEP15_EVENT.date).toBe('2026-09-15')
    expect(entry.transactionDate).toBe('2026-09-14T19:28:14Z')
    // Same money, same row: the settlement date survives on the header.
    expect(payoutEvidence(SEP15_SUMMARY).issuedOn).toBe('2026-09-15')
  })

  it('is a real timestamp on every real event, never a promoted midnight', () => {
    for (const [, event] of REAL_EVENTS) {
      expect(processorEvidence(event).transactionDate).toBe(event.effective_date)
      expect(processorEvidence(event).transactionDate).not.toMatch(/T00:00:00Z$/)
    }
  })

  it('falls back to the date-only settlement date, promoted to UTC midnight', () => {
    const { effective_date, ...noTimestamp } = SEP15_EVENT
    void effective_date
    expect(processorEvidence(noTimestamp).transactionDate).toBe('2026-09-15T00:00:00Z')
  })

  it('is null when the row carries neither, rather than invented', () => {
    const { effective_date, date, ...neither } = SEP15_EVENT
    void effective_date
    void date
    expect(processorEvidence(neither).transactionDate).toBeNull()
  })

  it('rejects a timestamp it cannot read instead of coercing one', () => {
    expect(() => processorEvidence({ ...SEP15_EVENT, effective_date: '09/14/2026' })).toThrow(
      /invalid settlement event date/
    )
  })
})

describe('field discipline', () => {
  it('passes order_id through verbatim and never parses it', () => {
    // It is the Shopify PaymentSession id (probe §4). A parsed guess that
    // overwrote the original would not be recoverable.
    const entry = processorEvidence({ ...SEP15_EVENT, order_id: 'gid://shopify/PaymentSession/x' })
    expect(entry.sourceOrderId).toBe('gid://shopify/PaymentSession/x')
  })

  it('does NOT add transaction_fees to fees — that double-counts the per-event fee', () => {
    // THE REGRESSION TEST. `fees` is the WHOLE fee on the public API and
    // `transaction_fees` is a component breakdown OF it, verified on all six
    // live deposits: `total_settled == sales + fees`, exactly, every time.
    //
    // The first implementation computed `-(fees + transaction_fees)` because
    // the CSV export SPLITS the same money into two columns that sum to the
    // API's single `fees`. That overstates fee expense and gross by the
    // per-event fee — 30 cents here — and the entry still balances
    // (`gross - fee === net`), so the platform's own checks cannot see it.
    // Only this assertion can.
    const entry = processorEvidence(SEP15_EVENT)
    expect(SEP15_EVENT.transaction_fees).toBe(-30)
    expect(entry.fee).toBe('160.75') // -(-16075). NOT 161.05, which is -(-16075 + -30).
    expect(entry.gross).toBe('3740.05') // NOT 3740.35.
    // Stated as arithmetic rather than as a literal, so it reads as the rule:
    // the fee is the negation of `fees` ALONE, whatever `transaction_fees` says.
    expect(entry.fee).toBe(evidenceAmount(-affirmMinor(SEP15_EVENT.fees, 2, 'minor'), 2))

    // And it is indifferent to `transaction_fees` entirely: change it, or drop
    // it, and the fee does not move.
    for (const transaction_fees of [-30, -999, 0, undefined]) {
      expect(processorEvidence({ ...SEP15_EVENT, transaction_fees }).fee).toBe('160.75')
    }
  })

  it('reads total_fees as an alias of fees, because the two feeds disagree', () => {
    // `/settlements/events` says `fees`; `/settlements/daily` says `total_fees`.
    // Both name the same whole fee, so both are read — and `txn_fees`, the
    // CSV's spelling of `transaction_fees`, is read by neither.
    const { fees, ...renamed } = SEP15_EVENT
    void fees
    expect(processorEvidence({ ...renamed, total_fees: -16075 }).fee).toBe('160.75')
    expect(processorEvidence({ ...renamed, txn_fees: -30 }).fee).toBe('0.00')
  })

  it('treats absent fee fields as zero rather than failing the row', () => {
    const entry = processorEvidence({
      id: 'EVT1',
      deposit_id: 'I5Y8PHAWWSSS2WJ',
      date: '2026-09-15',
      event_type: 'loan_captured',
      total_settled: 100000,
    })
    expect(entry.fee).toBe('0.00')
    expect(entry.gross).toBe('1000.00')
    expect(entry.net).toBe('1000.00')
  })

  it('keeps every entry inside the contract schema', () => {
    const entries: AffirmProcessorEvidence[] = [SEP15_EVENT, ...SEP03_EVENTS].map((event) =>
      processorEvidence(event)
    )
    for (const entry of entries) expect(parseEntry(entry)).toBeTruthy()
  })
})

describe('the imported contract is live', () => {
  // Negative control. If the cross-repo alias ever resolved to something inert,
  // every other assertion in this file would pass vacuously. These two prove the
  // platform code actually rejects things.
  it('rejects an entry whose gross less fee does not equal its net', () => {
    const broken = envelope(SEP15_SUMMARY, [SEP15_EVENT])
    broken.membership.entries[0]!.gross = '3741.05'
    const result = assessPayoutMembership(broken)
    expect(result.reason).toContain('gross less fees differs from its reported net')
  })

  it('rejects an entry shape the schema does not declare', () => {
    expect(() =>
      processorBalanceEvidenceSchema.parse({
        ...contractEntry(processorEvidence(SEP15_EVENT)),
        providerType: 'loan_captured',
      })
    ).toThrow()
  })
})
