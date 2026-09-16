// src/tools/shared/writes.ts

/**
 * Capture, refund and void — the three Affirm WRITES (build plan §7).
 *
 * ⚠️ Read this before changing anything below.
 *
 * ## There is no sandbox
 *
 * This account has production keys only (build plan §3.1). Every call in this
 * file moves money on a real customer's consumer loan, and nothing here has
 * ever been exercised against the live API. Every test stubs `fetch`.
 *
 * ## A competing writer exists
 *
 * Shopify's own refund path can refund the SAME Affirm charge. These tools talk
 * to Affirm DIRECTLY and tell Shopify nothing: after a refund issued here the
 * Shopify order still reads as unrefunded, and the operator has to refund it in
 * Shopify as well — which, in a Shopify-connected store, can send a SECOND
 * refund to Affirm. Nothing in this app calls Shopify, and nothing here tries
 * to detect or prevent the second writer; that is an operator decision, stated
 * in every tool description rather than guessed at in code.
 *
 * ## Void vs refund is Affirm's call, not ours
 *
 * The documentation does not state the boundary crisply — whether an
 * uncaptured charge must be voided, whether a captured one can still be voided
 * inside some window, and how split capture moves the line are all unstated.
 * So nothing here pre-judges it. The request goes to the operation the operator
 * asked for, and Affirm's documented **409 Conflict** is surfaced with a plain
 * message naming the other operation. A guess in code would be a silent wrong
 * answer; a 409 is a visible right one.
 *
 * ## Amounts are integer MINOR UNITS
 *
 * Affirm takes and returns cents on every one of these endpoints, exactly as
 * the settlement API does (probe §2). Tool inputs are cents too. Taking dollars
 * and converting would put a float multiplication on the amount of a refund,
 * which is the one place in this codebase that must never happen.
 */

import {
  AFFIRM_DEFAULT_CURRENCY,
  evidenceAmount,
  evidenceCurrencyExponent,
} from '../../settlement-evidence'
import { affirmApi } from './affirm-api'
import type { AffirmCredentials } from './connection'

/** The three writes. Each is `POST /api/v1/transactions/{id}/<operation>`. */
export type AffirmWriteOperation = 'capture' | 'refund' | 'void'

/**
 * What Affirm answers a write with. Capture and refund return the full set;
 * void documents only `type`, `created` and `id`. Members stay open — this is
 * a response object, and Affirm adds keys.
 */
export interface AffirmWriteEvent {
  id?: unknown
  type?: unknown
  created?: unknown
  currency?: unknown
  amount?: unknown
  fee?: unknown
  [key: string]: unknown
}

/** A write response, flattened. Every member is nullable — see `projectWriteEvent`. */
export interface ProjectedWriteEvent {
  /** Affirm's transaction-event id for what just happened. */
  id: string | null
  /** Affirm's own event type, e.g. `capture`, `refund`, `void`. */
  type: string | null
  /** RFC 3339 timestamp. */
  created: string | null
  currency: string | null
  /**
   * Exact decimal string, converted from Affirm's minor units with integer and
   * string arithmetic only. Null when Affirm reported no amount — which is the
   * documented case for a void.
   */
  amount: string | null
  /** Affirm's own integer minor units, unconverted, for reconciliation. */
  amountMinor: number | null
  /** Exact decimal string. See {@link ProjectedWriteEvent.feeMinor}. */
  fee: string | null
  /**
   * The merchant fee Affirm attached to this event, in minor units.
   *
   * ⚠️ On a refund, the returned `amount` ALREADY INCLUDES any refunded fee.
   * The two are surfaced separately and never collapsed: subtracting them here
   * would bake in an interpretation of an Affirm sentence that the operator can
   * read for themselves, and the settlement feed is the authority on what
   * actually netted.
   */
  feeMinor: number | null
}

/** The outcome of one write, plus the key it was sent under. */
export interface AffirmWriteOutcome {
  event: ProjectedWriteEvent
  /**
   * The `Idempotency-Key` this request carried. Surfaced so a retry can be
   * repeated deliberately under the same key, and so an audit can tell one
   * logical operation from two.
   */
  idempotencyKey: string
}

/** A minor-unit integer from a response, or null. Never throws. */
function minorUnits(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    return Number.isSafeInteger(parsed) ? parsed : null
  }
  return null
}

const optionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null

/**
 * Project a write response.
 *
 * **Nothing here throws.** By the time this function runs the money has already
 * moved, and a projection that threw would report a completed capture or refund
 * as a failure — inviting the operator to do it again. So every field is
 * nullable and an unreadable one is reported as absent, not as an error.
 */
export function projectWriteEvent(raw: AffirmWriteEvent): ProjectedWriteEvent {
  const currency = optionalText(raw.currency)
  const amountMinor = minorUnits(raw.amount)
  const feeMinor = minorUnits(raw.fee)

  // An unknown currency would throw out of `evidenceCurrencyExponent`; fall
  // back rather than lose the answer. `AFFIRM_DEFAULT_CURRENCY` is USD, and
  // this is a US-region merchant.
  let exponent: number
  try {
    exponent = evidenceCurrencyExponent(currency ?? AFFIRM_DEFAULT_CURRENCY)
  } catch {
    exponent = evidenceCurrencyExponent(AFFIRM_DEFAULT_CURRENCY)
  }

  return {
    id: optionalText(raw.id),
    type: optionalText(raw.type),
    created: optionalText(raw.created),
    currency,
    amount: amountMinor === null ? null : evidenceAmount(BigInt(amountMinor), exponent),
    amountMinor,
    fee: feeMinor === null ? null : evidenceAmount(BigInt(feeMinor), exponent),
    feeMinor,
  }
}

/**
 * Derive the `Idempotency-Key` for one logical write.
 *
 * ## Why it is derived rather than random
 *
 * Affirm documents the header as *"a unique identifier pre-generated by the
 * client… if a request fails or times out, use the same idempotency key to
 * retry the operation without risk of double-processing."* A random key per
 * attempt would satisfy the letter of that and none of its value: the dangerous
 * case is precisely the one where the caller does NOT know whether the first
 * attempt landed — a timeout, a dropped connection, an agent retrying its own
 * tool call — and a fresh key in that moment is what turns one refund into two.
 *
 * So the key is a pure function of the request. The same logical request, re-sent
 * for any reason, carries the same key and Affirm collapses it.
 *
 * ## What is in it, and what is deliberately not
 *
 * `operation + merchant + charge + amount + referenceId`, JSON-encoded (so no
 * separator can be forged out of a caller's `referenceId`), SHA-256'd, hex.
 *
 * - **`operation`** — a capture and a void of the same charge are different acts.
 * - **`merchantId`** — costs nothing, and this account's own settlement rows
 *   carry both `merchant_id` and `initiating_merchant_id`.
 * - **`amount`** — a 10.00 refund and a 25.00 refund are different acts. A full
 *   refund (no amount) keys as `full`, distinct from any partial.
 * - **`referenceId`** — the operator's own escape hatch, below.
 * - **NOT capture's `shippingCarrier` / `shippingConfirmation` / `orderId`.**
 *   These are informational, and including them would mean that fixing a typo'd
 *   tracking number issues a SECOND capture. Excluding them means such a fix is
 *   a no-op instead. Between those two failures the no-op is the safe one. To
 *   genuinely re-send, set a different `referenceId`.
 *
 * ## ⚠️ The trade this makes, stated plainly
 *
 * Two *intentionally separate* refunds of the same amount on the same charge
 * derive the SAME key, so Affirm will answer the second with the first's result
 * and no second refund happens. That is the deliberate direction to fail in —
 * silently refunding twice is worse than silently refunding once. The operator's
 * escape hatch is `referenceId`: give the two refunds different reference ids
 * and they become different keys.
 *
 * The output is hex, so it is header-safe by construction and a caller's
 * free-form `referenceId` can never reach a request header.
 */
export async function affirmIdempotencyKey(input: {
  operation: AffirmWriteOperation
  merchantId: string
  chargeId: string
  /** Minor units, or null/undefined for "whatever Affirm's default is". */
  amountMinor?: number | null
  referenceId?: string | null
}): Promise<string> {
  const material = JSON.stringify([
    'auxx.affirm.write.v1',
    input.operation,
    input.merchantId,
    input.chargeId,
    input.amountMinor ?? 'full',
    input.referenceId ?? '',
  ])
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material))
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `auxx-${input.operation}-${hex}`
}

/** What each 409 should tell the operator to do instead. */
const CONFLICT_GUIDANCE: Record<AffirmWriteOperation, string> = {
  capture:
    'Affirm refused to capture this charge in its current state. It may already be ' +
    'captured, already voided, or the amount may exceed the authorised balance. Read the ' +
    'charge with get_affirm_charge before trying anything else — do not retry with a ' +
    'different amount to find out.',
  refund:
    'Affirm refused to refund this charge in its current state. If it has NOT been ' +
    'captured yet, the operation you want is a VOID, not a refund — use void_affirm_charge. ' +
    'If it is already fully refunded, there is nothing left to refund.',
  void:
    'Affirm refused to void this charge in its current state. If it has already been ' +
    'captured, the operation you want is a REFUND, not a void — use refund_affirm_charge.',
}

/**
 * Issue one write, translating a documented 409 into an instruction.
 *
 * The 409 handler is the ONLY place this app has an opinion about the
 * capture/refund/void boundary, and the opinion is "ask Affirm". Affirm's own
 * message is kept and the guidance appended, so a refusal we did not anticipate
 * still arrives intact rather than being replaced by our guess about it.
 */
async function affirmWrite(
  operation: AffirmWriteOperation,
  credentials: AffirmCredentials,
  chargeId: string,
  body: Record<string, unknown>,
  idempotencyKey: string
): Promise<AffirmWriteOutcome> {
  let raw: AffirmWriteEvent
  try {
    raw = await affirmApi<AffirmWriteEvent>({
      endpoint: `/transactions/${encodeURIComponent(chargeId)}/${operation}`,
      credentials,
      method: 'POST',
      body,
      idempotencyKey,
    })
  } catch (err) {
    if (err instanceof Error && (err as { code?: string }).code === 'CONFLICT') {
      err.message = `${err.message} ${CONFLICT_GUIDANCE[operation]}`
    }
    throw err
  }

  // A 200 with no body would be Affirm breaking its own contract, but the money
  // has still moved. Project an empty object rather than throwing, so the
  // operator is told it happened and that Affirm described it oddly.
  return {
    event: projectWriteEvent(raw && typeof raw === 'object' ? raw : {}),
    idempotencyKey,
  }
}

/** Capture input. Everything except the charge is optional, per the reference. */
export interface AffirmCaptureInput {
  chargeId: string
  /** ⚠️ Split-capture merchants only. Minor units. Omit for a full capture. */
  amountMinor?: number
  orderId?: string
  referenceId?: string
  shippingCarrier?: string
  shippingConfirmation?: string
}

/** `POST /transactions/{id}/capture`. Settles an authorised Affirm loan. */
export async function captureAffirmCharge(
  credentials: AffirmCredentials,
  input: AffirmCaptureInput
): Promise<AffirmWriteOutcome> {
  const key = await affirmIdempotencyKey({
    operation: 'capture',
    merchantId: credentials.merchantId,
    chargeId: input.chargeId,
    amountMinor: input.amountMinor ?? null,
    referenceId: input.referenceId ?? null,
  })
  // Only what the caller set. `JSON.stringify` drops the undefined members, so
  // Affirm's own defaults apply to everything left out.
  return affirmWrite(
    'capture',
    credentials,
    input.chargeId,
    {
      amount: input.amountMinor,
      order_id: input.orderId,
      reference_id: input.referenceId,
      shipping_carrier: input.shippingCarrier,
      shipping_confirmation: input.shippingConfirmation,
    },
    key
  )
}

/** Refund input. Omitting the amount refunds the whole remaining balance. */
export interface AffirmRefundInput {
  chargeId: string
  /** Minor units, minimum 1. Omit to refund the entire remaining balance. */
  amountMinor?: number
  referenceId?: string
}

/** `POST /transactions/{id}/refund`. Returns money on a captured Affirm loan. */
export async function refundAffirmCharge(
  credentials: AffirmCredentials,
  input: AffirmRefundInput
): Promise<AffirmWriteOutcome> {
  const key = await affirmIdempotencyKey({
    operation: 'refund',
    merchantId: credentials.merchantId,
    chargeId: input.chargeId,
    amountMinor: input.amountMinor ?? null,
    referenceId: input.referenceId ?? null,
  })
  return affirmWrite(
    'refund',
    credentials,
    input.chargeId,
    { amount: input.amountMinor, reference_id: input.referenceId },
    key
  )
}

/** Void input. `amount` is documented as split-capture only. */
export interface AffirmVoidInput {
  chargeId: string
  /** ⚠️ Split-capture merchants only. Minor units. Omit for a full void. */
  amountMinor?: number
  referenceId?: string
}

/** `POST /transactions/{id}/void`. Cancels an Affirm loan before it settles. */
export async function voidAffirmCharge(
  credentials: AffirmCredentials,
  input: AffirmVoidInput
): Promise<AffirmWriteOutcome> {
  const key = await affirmIdempotencyKey({
    operation: 'void',
    merchantId: credentials.merchantId,
    chargeId: input.chargeId,
    amountMinor: input.amountMinor ?? null,
    referenceId: input.referenceId ?? null,
  })
  return affirmWrite(
    'void',
    credentials,
    input.chargeId,
    { amount: input.amountMinor, reference_id: input.referenceId },
    key
  )
}
