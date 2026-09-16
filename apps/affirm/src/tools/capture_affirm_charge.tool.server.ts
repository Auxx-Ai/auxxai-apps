// src/tools/capture_affirm_charge.tool.server.ts

/**
 * `POST /api/v1/transactions/{id}/capture` — settle an authorised Affirm loan.
 *
 * ⚠️ This moves real money on a real customer's consumer loan and there is no
 * sandbox to rehearse it in. See `./shared/writes.ts` for the whole fence; the
 * three rules that bear on this file:
 *
 * 1. Nothing retries. A capture is only replayable because of the derived
 *    `Idempotency-Key`, and that is `affirmIdempotencyKey`'s job, not a loop's.
 * 2. Shopify is NOT told. `SHOPIFY_NOT_TOLD` rides on every result.
 * 3. A 409 is Affirm saying the charge is not in a state to be captured. It is
 *    surfaced, never worked around by retrying at a different amount.
 */

import { getAffirmCredentials } from './shared/connection'
import { SHOPIFY_NOT_TOLD } from './shared/schemas'
import { captureAffirmCharge } from './shared/writes'

interface CaptureAffirmChargeInput {
  chargeId: string
  amountMinor?: number
  orderId?: string
  referenceId?: string
  shippingCarrier?: string
  shippingConfirmation?: string
}

export default async function captureAffirmChargeTool(input: CaptureAffirmChargeInput) {
  const credentials = getAffirmCredentials()
  const { event, idempotencyKey } = await captureAffirmCharge(credentials, input)

  const money =
    event.amount === null
      ? 'Affirm reported no amount on the capture'
      : `${event.amount} ${event.currency ?? ''}`.trim()
  const summary =
    `Captured Affirm charge ${input.chargeId}: ${money}` +
    (event.fee === null ? '' : `, fee ${event.fee}`) +
    (event.id === null ? '' : `, Affirm event ${event.id}`) +
    (event.created === null ? '' : ` at ${event.created}`) +
    (input.amountMinor === undefined
      ? '. This was a FULL capture — no amount was sent.'
      : `. ${input.amountMinor} minor units were requested (split capture).`) +
    ` ${SHOPIFY_NOT_TOLD}`

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
