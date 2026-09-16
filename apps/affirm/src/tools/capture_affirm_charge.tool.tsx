// src/tools/capture_affirm_charge.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import affirmIcon from '../assets/affirm.png'
import captureAffirmChargeExecute from './capture_affirm_charge.tool.server'
import { exampleCaptureResult, writeResultSchema } from './shared/schemas'

/**
 * ⚠️ A WRITE against a live lender. Member of `affirm.write`, never of
 * `affirm.settlements`. See ./toolsets.ts.
 */
export const captureAffirmChargeTool = defineTool({
  id: 'capture_affirm_charge',
  name: 'Capture Affirm charge',
  description:
    'Capture an authorised Affirm charge, settling the customer’s loan so Affirm pays the ' +
    'merchant for it. ' +
    '⚠️ THIS MOVES REAL MONEY ON A REAL CUSTOMER’S CONSUMER LOAN and cannot be undone from ' +
    'here — the reverse of a capture is a REFUND (refund_affirm_charge), which is a separate ' +
    'act with its own fee consequences. If the charge has NOT been captured and you want to ' +
    'cancel it outright, that is a VOID (void_affirm_charge), not a capture followed by a ' +
    'refund. ' +
    'THIS DOES NOT TELL SHOPIFY. Shopify is the system of record for the order and it is not ' +
    'notified, so the order’s payment state there is unchanged and must be reconciled by hand. ' +
    'amountMinor is INTEGER MINOR UNITS (cents: 374005 is $3,740.05), and it is for ' +
    'split-capture merchants ONLY — omit it for a normal full capture. ' +
    'Every call sends an Idempotency-Key derived from the operation, charge, amount and ' +
    'referenceId, so re-issuing the SAME request is processed once; a call with a DIFFERENT ' +
    'referenceId or amount is a different key and CAPTURES AGAIN. ' +
    'Confirm the charge with get_affirm_charge first, and only capture once the goods have ' +
    'actually shipped.',
  icon: affirmIcon,
  inputs: z.object({
    chargeId: z
      .string()
      .min(1)
      .describe('The Affirm charge ARI to capture, e.g. CPDZ-ANRU. Not a Shopify order number.'),
    amountMinor: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'SPLIT-CAPTURE MERCHANTS ONLY. Amount in INTEGER MINOR UNITS (cents) — 2500 is $25.00, ' +
          'never 25. Omit this for a normal full capture; sending it on a non-split-capture ' +
          'account is how Affirm answers 409.'
      ),
    orderId: z
      .string()
      .min(1)
      .max(128)
      .optional()
      .describe('Your own order identifier, recorded on Affirm’s side. 1–128 characters.'),
    referenceId: z
      .string()
      .min(1)
      .max(128)
      .optional()
      .describe(
        'Your own reconciliation identifier, 1–128 characters. It also forms part of the ' +
          'idempotency key: use a DIFFERENT one when you genuinely mean a second, separate ' +
          'capture, and the SAME one when you are retrying the first.'
      ),
    shippingCarrier: z.string().min(1).max(128).optional().describe('Carrier name, e.g. fedex.'),
    shippingConfirmation: z
      .string()
      .min(1)
      .max(128)
      .optional()
      .describe(
        'Tracking number for the shipment. NOT part of the idempotency key — correcting a ' +
          'typo’d tracking number under the same referenceId is a no-op, not a second capture.'
      ),
  }),
  outputs: writeResultSchema,
  // ⚠️ SYNTHETIC — there is no sandbox, so no capture response has ever been
  // observed. Documented shape, invented values. See ./shared/schemas.ts.
  exampleOutput: exampleCaptureResult,
  config: { requiresConnection: true, timeout: 30000 },
  execute: captureAffirmChargeExecute,
  // Its own toolset, so granting the settlement reads never grants the ability
  // to settle a loan. Narrower than the reads: `chat` and `email` are off (a
  // request arriving by email is not proof the sender may spend), and so is
  // `builder` — there is no sandbox, so there is no such thing as trying this
  // one out. Nothing is `externalSafe`.
  agent: { toolsetSlug: 'affirm.write', surfaces: ['internal'] },
})
