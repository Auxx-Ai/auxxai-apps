// tests/settlement-evidence.test.ts
//
// Acceptance is asserted with the platform's own schemas and assessor, imported across
// the repo boundary via a vitest alias; a copy would drift. No live probe has run, so
// every fixture is synthetic — `ASSUMPTIONS.md` lists what the probe must confirm.

import {
  assessPayoutMembership,
  payoutEvidenceEnvelopeSchema,
  processorActivityKindSchema,
  processorBalanceEvidenceSchema,
} from '@auxx/lib/money/payouts/evidence-contracts'
import { splitStoredEntries } from '@auxx/lib/money/payouts/client'
import { describe, expect, it } from 'vitest'
import {
  AUTHORIZE_NET_DEFAULT_CURRENCY,
  type AuthorizeNetBatch,
  type AuthorizeNetProcessorEvidence,
  type AuthorizeNetTransactionSummary,
  authorizeNetActivityKind,
  batchNetAmount,
  payoutEvidence,
  processorEvidence,
} from '../src/settlement-evidence'

const SOURCE_ACCOUNT = { externalAccountId: '565697', environment: 'live' as const }

/** `processorBalanceEvidenceSchema` is `.strict()` and does not declare `providerType`. */
function contractEntry(entry: AuthorizeNetProcessorEvidence) {
  const { providerType, ...rest } = entry
  void providerType
  return rest
}

function members(batch: AuthorizeNetBatch, rows: AuthorizeNetTransactionSummary[]) {
  return rows
    .map((row) => processorEvidence(row, batch))
    .filter((entry): entry is AuthorizeNetProcessorEvidence => entry !== null)
}

function envelope(
  batch: AuthorizeNetBatch,
  rows: AuthorizeNetTransactionSummary[],
  membership: { complete?: boolean; providerReady?: boolean; reason?: string | null } = {}
) {
  return {
    version: 1 as const,
    sourceAccount: SOURCE_ACCOUNT,
    payout: payoutEvidence(batch),
    membership: {
      complete: membership.complete ?? true,
      providerReady: membership.providerReady ?? batch.settlementState === 'settledSuccessfully',
      reason: membership.reason ?? null,
      entries: members(batch, rows).map(contractEntry),
    },
  }
}

/** Parse with the platform schema, then assess with the platform assessor. */
function assess(input: ReturnType<typeof envelope>) {
  return assessPayoutMembership(payoutEvidenceEnvelopeSchema.parse(input))
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const settled = (
  transId: string,
  settleAmount: string,
  accountType: string,
  extra: Partial<AuthorizeNetTransactionSummary> = {}
): AuthorizeNetTransactionSummary => ({
  transId,
  submitTimeUTC: '2026-01-05T09:00:00Z',
  transactionStatus: 'settledSuccessfully',
  accountType,
  accountNumber: 'XXXX1111',
  amount: settleAmount,
  settleAmount,
  invoiceNumber: '3754',
  ...extra,
})

/** Visa + MasterCard + AmericanExpress in one batch: 100.00 + 50.25 + 25.75 = 176.00. */
const MULTI_BRAND_BATCH: AuthorizeNetBatch = {
  batchId: '10198080',
  settlementTimeUTC: '2026-01-05T18:48:19Z',
  settlementTimeLocal: '2026-01-05T13:48:19',
  settlementState: 'settledSuccessfully',
  paymentMethod: 'creditCard',
  statistics: [
    {
      accountType: 'Visa',
      chargeAmount: '100.00',
      chargeCount: 2,
      refundAmount: '0.00',
      refundCount: 0,
      voidCount: 1,
      declineCount: 1,
      errorCount: 0,
    },
    {
      accountType: 'MasterCard',
      chargeAmount: '50.25',
      chargeCount: 1,
      refundAmount: '0.00',
      refundCount: 0,
      voidCount: 0,
      declineCount: 0,
      errorCount: 0,
    },
    {
      accountType: 'AmericanExpress',
      chargeAmount: '25.75',
      chargeCount: 1,
      refundAmount: '0.00',
      refundCount: 0,
      voidCount: 0,
      declineCount: 0,
      errorCount: 0,
    },
  ],
}

const MULTI_BRAND_ROWS: AuthorizeNetTransactionSummary[] = [
  settled('60000001', '60.00', 'Visa'),
  settled('60000002', '40.00', 'Visa'),
  settled('60000003', '50.25', 'MasterCard'),
  settled('60000004', '25.75', 'AmericanExpress'),
  // Counted by the batch, never banked — these must be OMITTED from membership.
  { ...settled('60000005', '15.00', 'Visa'), transactionStatus: 'voided' },
  { ...settled('60000006', '12.00', 'Visa'), transactionStatus: 'declined' },
]

/** One charge of 100.00 and a refund of 30.00: the header is 70.00. */
const REFUND_BATCH: AuthorizeNetBatch = {
  batchId: '10198081',
  settlementTimeUTC: '2026-01-06T18:48:19Z',
  settlementState: 'settledSuccessfully',
  statistics: [
    {
      accountType: 'Visa',
      chargeAmount: '100.00',
      chargeCount: 1,
      refundAmount: '30.00',
      refundCount: 1,
      voidCount: 0,
      declineCount: 0,
      errorCount: 0,
    },
  ],
}

const REFUND_ROWS: AuthorizeNetTransactionSummary[] = [
  settled('60000010', '100.00', 'Visa'),
  // Assumed: the gateway reports a refund's `settleAmount` unsigned.
  { ...settled('60000011', '30.00', 'Visa'), transactionStatus: 'refundSettledSuccessfully' },
]

/** An eCheck batch with a returned item: 200.00 charged, 75.00 returned, header 125.00. */
const ECHECK_BATCH: AuthorizeNetBatch = {
  batchId: '10198082',
  settlementTimeUTC: '2026-01-07T18:48:19Z',
  settlementState: 'settledSuccessfully',
  paymentMethod: 'eCheck',
  statistics: [
    {
      accountType: 'eCheck',
      chargeAmount: '200.00',
      chargeCount: 1,
      refundAmount: '0.00',
      refundCount: 0,
      voidCount: 0,
      declineCount: 0,
      errorCount: 0,
      returnedItemAmount: '75.00',
      returnedItemCount: 1,
    },
  ],
}

const ECHECK_ROWS: AuthorizeNetTransactionSummary[] = [
  settled('60000020', '200.00', 'eCheck'),
  {
    ...settled('60000021', '75.00', 'eCheck'),
    transactionStatus: 'returnedItem',
    hasReturnedItems: true,
  },
]

/** A batch the acquirer could not settle. The header is still emitted. */
const ERROR_BATCH: AuthorizeNetBatch = {
  batchId: '10198083',
  settlementTimeUTC: '2026-01-08T18:48:19Z',
  settlementState: 'settlementError',
  statistics: [
    {
      accountType: 'Visa',
      chargeAmount: '10.00',
      chargeCount: 1,
      refundAmount: '0.00',
      refundCount: 0,
      voidCount: 0,
      declineCount: 0,
      errorCount: 1,
    },
  ],
}

// ---------------------------------------------------------------------------

describe('the header', () => {
  it('sums the per-brand statistics, because there is no single total', () => {
    const header = payoutEvidence(MULTI_BRAND_BATCH)
    expect(header.amount).toBe('176.00')
    expect(header.id).toBe('10198080')
    expect(header.currency).toBe(AUTHORIZE_NET_DEFAULT_CURRENCY)
    expect(header.issuedAt).toBe('2026-01-05T18:48:19Z')
    expect(header.issuedOn).toBe('2026-01-05')
    // No batch names a bank account — build plan §3.4 item 3.
    expect(header.destinationExternalId).toBeNull()
    // The per-brand split survives verbatim for the bank matcher.
    expect((header.raw.statistics ?? []).map((stat) => stat.accountType)).toEqual([
      'Visa',
      'MasterCard',
      'AmericanExpress',
    ])
  })

  it('subtracts refunds, and returned items only on the eCheck rows', () => {
    expect(payoutEvidence(REFUND_BATCH).amount).toBe('70.00')
    expect(payoutEvidence(ECHECK_BATCH).amount).toBe('125.00')
    expect(batchNetAmount(MULTI_BRAND_BATCH.statistics)).toBe('176.00')
    expect(batchNetAmount(undefined)).toBe('0.00')
  })

  it('carries a settlementError state rather than dropping the batch', () => {
    const header = payoutEvidence(ERROR_BATCH)
    expect(header.status).toBe('settlementError')
    expect(header.amount).toBe('10.00')
    // Emitted, valid, and refused downstream — not absent.
    expect(() => payoutEvidenceEnvelopeSchema.parse(envelope(ERROR_BATCH, []))).not.toThrow()
    expect(assess(envelope(ERROR_BATCH, [])).differenceMinor).toBe(BigInt(1000))
  })

  it('takes the currency the merchant details reported', () => {
    expect(payoutEvidence(MULTI_BRAND_BATCH, { currency: 'cad' }).currency).toBe('CAD')
    expect(() => payoutEvidence(MULTI_BRAND_BATCH, { currency: 'US' })).toThrow()
  })
})

describe('activity kinds', () => {
  it('maps every documented case of build plan §4.3', () => {
    expect(authorizeNetActivityKind('authCaptureTransaction', 'settledSuccessfully')).toBe('charge')
    expect(authorizeNetActivityKind('captureOnlyTransaction', 'settledSuccessfully')).toBe('charge')
    expect(authorizeNetActivityKind('priorAuthCaptureTransaction', 'settledSuccessfully')).toBe(
      'charge'
    )
    expect(authorizeNetActivityKind('refundTransaction', 'refundSettledSuccessfully')).toBe(
      'refund'
    )
    // A void and an authorization never settle and carry no money.
    expect(authorizeNetActivityKind('voidTransaction', 'voided')).toBeNull()
    expect(authorizeNetActivityKind('authOnlyTransaction', 'authorizedPendingCapture')).toBeNull()
    expect(authorizeNetActivityKind(undefined, 'declined')).toBeNull()
    expect(authorizeNetActivityKind(undefined, 'generalError')).toBeNull()
    // `returned_transfer` would mean a payout came back, which this is not.
    expect(authorizeNetActivityKind(undefined, 'returnedItem')).toBe('adjustment')
    expect(authorizeNetActivityKind(undefined, 'chargeback')).toBe('adjustment')
    expect(authorizeNetActivityKind('someFutureTransaction', 'settledSuccessfully')).toBe('unknown')
  })

  it('reads the status alone when the list surface names no transactionType', () => {
    expect(authorizeNetActivityKind(undefined, 'settledSuccessfully')).toBe('charge')
    expect(authorizeNetActivityKind(undefined, 'refundSettledSuccessfully')).toBe('refund')
  })

  it('only ever returns a kind the platform enum accepts', () => {
    for (const kind of ['charge', 'refund', 'adjustment', 'unknown']) {
      expect(processorActivityKindSchema.parse(kind)).toBe(kind)
    }
  })
})

describe('a member entry', () => {
  it('has a zero fee, and gross equal to net', () => {
    const [entry] = members(MULTI_BRAND_BATCH, [MULTI_BRAND_ROWS[0]!])
    expect(entry).toBeDefined()
    expect(entry!.gross).toBe('60.00')
    expect(entry!.fee).toBe('0.00')
    expect(entry!.net).toBe('60.00')
    expect(entry!.payoutId).toBe('10198080')
    expect(entry!.sourceTransactionId).toBe('60000001')
    // `invoiceNumber` VERBATIM; recognition is a later, separate join.
    expect(entry!.sourceOrderId).toBe('3754')
    expect(entry!.sourceType).toBe('Visa')
    expect(() => processorBalanceEvidenceSchema.parse(contractEntry(entry!))).not.toThrow()
  })

  it('reads the list surface’s `invoice` alias too', () => {
    const row = {
      ...settled('60000030', '5.00', 'Visa'),
      invoiceNumber: undefined,
      invoice: '#412',
    }
    expect(members(MULTI_BRAND_BATCH, [row])[0]!.sourceOrderId).toBe('#412')
  })

  it('signs a refund and a returned item negative', () => {
    expect(members(REFUND_BATCH, REFUND_ROWS)[1]!.net).toBe('-30.00')
    expect(members(ECHECK_BATCH, ECHECK_ROWS)[1]!.net).toBe('-75.00')
  })

  it('stamps a naked `...UTC` timestamp, which the contract would otherwise refuse', () => {
    const row = { ...settled('60000040', '5.00', 'Visa'), submitTimeUTC: '2026-01-05T09:00:00' }
    expect(members(MULTI_BRAND_BATCH, [row])[0]!.transactionDate).toBe('2026-01-05T09:00:00Z')
  })

  it('omits a void and a decline instead of rejecting them', () => {
    expect(processorEvidence(MULTI_BRAND_ROWS[4]!, MULTI_BRAND_BATCH)).toBeNull()
    expect(processorEvidence(MULTI_BRAND_ROWS[5]!, MULTI_BRAND_BATCH)).toBeNull()
  })
})

describe('Σ member net === header amount', () => {
  it('holds over a multi-brand batch, with the voids and declines omitted', () => {
    const result = assess(envelope(MULTI_BRAND_BATCH, MULTI_BRAND_ROWS))
    expect(result.state).toBe('complete')
    expect(result.differenceMinor).toBe(BigInt(0))
    expect(result.constituentNetMinor).toBe(BigInt(17600))
  })

  it('holds over a batch with a refund', () => {
    const result = assess(envelope(REFUND_BATCH, REFUND_ROWS))
    expect(result.state).toBe('complete')
    expect(result.differenceMinor).toBe(BigInt(0))
  })

  it('holds over an eCheck batch with a returned item', () => {
    const result = assess(envelope(ECHECK_BATCH, ECHECK_ROWS))
    expect(result.state).toBe('complete')
    expect(result.differenceMinor).toBe(BigInt(0))
  })

  it('goes `unsupported` on an unknown transaction type rather than quietly short', () => {
    const rows = [
      settled('60000050', '176.00', 'Visa', { transactionType: 'someFutureTransaction' }),
    ]
    const result = assess(envelope(MULTI_BRAND_BATCH, rows))
    expect(result.state).toBe('unsupported')
    expect(result.reason).toContain('requires separate activity assessment')
  })

  it('reports the shortfall when membership is incomplete', () => {
    const result = assess(
      envelope(MULTI_BRAND_BATCH, MULTI_BRAND_ROWS.slice(0, 2), {
        complete: false,
        reason: 'Authorize.net batch membership has more transaction pages',
      })
    )
    expect(result.state).toBe('incomplete')
    expect(result.differenceMinor).toBe(BigInt(7600))
  })
})

describe('a zero fee mints no fee leg', () => {
  it('splits to zero fees through the platform’s own splitter', () => {
    const split = splitStoredEntries(
      members(MULTI_BRAND_BATCH, MULTI_BRAND_ROWS).map((entry) => ({
        type: entry.type,
        matchState: 'matched' as const,
        grossMinor: Number(entry.gross.replace('.', '')),
        feeMinor: 0,
        netMinor: Number(entry.net.replace('.', '')),
      }))
    )
    expect(split.feesMinor).toBe(0)
    expect(split.grossMinor).toBe(17600)
    expect(split.netMinor).toBe(17600)
  })
})
