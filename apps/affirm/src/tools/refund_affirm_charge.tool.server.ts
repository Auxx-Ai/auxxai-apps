// src/tools/refund_affirm_charge.tool.server.ts

/**
 * `POST /api/v1/transactions/{id}/refund` — return money on a captured Affirm
 * loan.
 *
 * ⚠️ The highest-consequence call in this app. It moves real money on a real
 * customer's consumer loan, there is no sandbox, and **Shopify can refund the
 * same charge independently** — so a refund issued here plus a refund issued in
 * Shopify Admin is two refunds, not one. Nothing in this app talks to Shopify
 * and nothing here tries to detect the second writer.
 *
 * ## The returned amount is not necessarily the requested amount
 *
 * Affirm documents the response `amount` as INCLUDING any refunded fee. So a
 * 2500-minor-unit request can legitimately come back as 2607 with `fee: 107`.
 * `amount` and `fee` are surfaced separately and never netted, and
 * `requestedAmountMinor` is echoed alongside so the operator can see both
 * numbers rather than being handed our arithmetic about them.
 *
 * ## Void, not refund
 *
 * Whether an uncaptured charge must be VOIDED rather than refunded is not
 * stated crisply in Affirm's docs, so it is not guessed here. Affirm's
 * documented 409 carries the answer and `affirmWrite` appends the instruction.
 */

import { getAffirmCredentials } from './shared/connection'
import { SHOPIFY_NOT_TOLD } from './shared/schemas'
import { refundAffirmCharge } from './shared/writes'

interface RefundAffirmChargeInput {
  chargeId: string
  amountMinor?: number
  referenceId?: string
}

export default async function refundAffirmChargeTool(input: RefundAffirmChargeInput) {
  const credentials = getAffirmCredentials()
  const { event, idempotencyKey } = await refundAffirmCharge(credentials, input)

  const asked =
    input.amountMinor === undefined
      ? 'a FULL refund of the remaining balance was requested'
      : `${input.amountMinor} minor units were requested`
  const got =
    event.amount === null
      ? 'Affirm reported no amount'
      : `Affirm returned ${event.amount} ${event.currency ?? ''}`.trim()
  // Said explicitly rather than netted: the returned amount carries the
  // refunded fee, and the operator is the one who decides what that means.
  const feeNote =
    event.fee === null
      ? ''
      : ` including a refunded fee of ${event.fee} — the returned amount ALREADY INCLUDES it, do not subtract it again`
  const mismatch =
    input.amountMinor !== undefined &&
    event.amountMinor !== null &&
    event.amountMinor !== input.amountMinor
      ? ' The returned amount differs from the requested amount; report both rather than picking one.'
      : ''

  const summary =
    `Refunded Affirm charge ${input.chargeId}: ${asked}, ${got}${feeNote}.` +
    (event.id === null ? '' : ` Affirm event ${event.id}`) +
    (event.created === null ? '' : ` at ${event.created}`) +
    `.${mismatch} ${SHOPIFY_NOT_TOLD}`

  return {
    summary,
    chargeId: input.chargeId,
    event,
    requestedAmountMinor: input.amountMinor ?? null,
    referenceId: input.referenceId ?? null,
    idempotencyKey,
    shopifyNotice: SHOPIFY_NOT_TOLD,
  }
}
