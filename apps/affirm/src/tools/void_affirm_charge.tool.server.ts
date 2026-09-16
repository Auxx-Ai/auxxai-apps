// src/tools/void_affirm_charge.tool.server.ts

/**
 * `POST /api/v1/transactions/{id}/void` — cancel an Affirm loan before it
 * settles.
 *
 * ⚠️ This cancels a real consumer loan and there is no sandbox. Unlike a
 * refund it is not a partial-money operation in the normal case — Affirm
 * documents `amount` here as split-capture only — so the default outcome is
 * that the whole charge stops existing as a receivable.
 *
 * ## Void reports no amount
 *
 * The documented void response is `{ type, created, id }` — no `currency`, no
 * `amount`, no `fee`. Those come back null, and the summary says so rather than
 * implying zero. To learn what was cancelled, read the charge first with
 * `get_affirm_charge`.
 *
 * ## Void vs refund
 *
 * Affirm's documentation does not state the boundary crisply, so nothing here
 * pre-judges it. The documented 409 is the answer, and `affirmWrite` appends
 * the instruction to use `refund_affirm_charge` instead.
 */

import { getAffirmCredentials } from './shared/connection'
import { SHOPIFY_NOT_TOLD } from './shared/schemas'
import { voidAffirmCharge } from './shared/writes'

interface VoidAffirmChargeInput {
  chargeId: string
  amountMinor?: number
  referenceId?: string
}

export default async function voidAffirmChargeTool(input: VoidAffirmChargeInput) {
  const credentials = getAffirmCredentials()
  const { event, idempotencyKey } = await voidAffirmCharge(credentials, input)

  const summary =
    `Voided Affirm charge ${input.chargeId}.` +
    (event.id === null ? '' : ` Affirm event ${event.id}`) +
    (event.created === null ? '' : ` at ${event.created}`) +
    (event.id === null && event.created === null ? '' : '.') +
    (input.amountMinor === undefined
      ? ' This was a FULL void — no amount was sent.'
      : ` ${input.amountMinor} minor units were requested (split capture).`) +
    (event.amount === null
      ? ' Affirm reports no amount on a void; read the charge with get_affirm_charge to see what was cancelled.'
      : ` Affirm reported ${event.amount} ${event.currency ?? ''}`.trimEnd() + '.') +
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
