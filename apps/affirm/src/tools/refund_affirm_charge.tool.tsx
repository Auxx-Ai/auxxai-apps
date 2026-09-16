// src/tools/refund_affirm_charge.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import affirmIcon from '../assets/affirm.png'
import refundAffirmChargeExecute from './refund_affirm_charge.tool.server'
import { exampleRefundResult, writeResultSchema } from './shared/schemas'

/**
 * ⚠️ A WRITE against a live lender, and the highest-consequence tool in this
 * app. Member of `affirm.write`, never of `affirm.settlements`.
 */
export const refundAffirmChargeTool = defineTool({
  id: 'refund_affirm_charge',
  name: 'Refund Affirm charge',
  description:
    'Refund a captured Affirm charge, returning money on the customer’s loan. ' +
    '⚠️ THIS MOVES REAL MONEY ON A REAL CUSTOMER’S CONSUMER LOAN and CANNOT BE UNDONE. ' +
    'THIS DOES NOT TELL SHOPIFY. The refund reaches Affirm and nothing else — the Shopify ' +
    'order will still show as UNREFUNDED, and the operator must refund it in Shopify as well ' +
    'to make the records agree. ⚠️ Shopify’s own refund path can also refund this same Affirm ' +
    'charge, so refunding in both places sends TWO refunds. Never refund here and in Shopify ' +
    'for the same money without confirming which one the operator intends. ' +
    'amountMinor is INTEGER MINOR UNITS (cents: 2500 is $25.00, never 25). Omit it to refund ' +
    'the entire remaining balance. ' +
    'The returned amount INCLUDES any refunded fee, so it can legitimately be LARGER than the ' +
    'amount you asked for; report the returned amount and fee separately rather than netting ' +
    'them. ' +
    'Every call sends an Idempotency-Key derived from the operation, charge, amount and ' +
    'referenceId, so re-issuing the SAME request is processed once. CALLING TWICE WITH A ' +
    'DIFFERENT referenceId OR A DIFFERENT AMOUNT IS A DIFFERENT KEY AND REFUNDS TWICE. ' +
    'If the charge has not been captured yet, the operation is a VOID (void_affirm_charge), ' +
    'not a refund — Affirm answers 409 and says so. ' +
    'Confirm the charge and what is left on it with get_affirm_charge first, and only refund ' +
    'once the refund has actually been agreed.',
  icon: affirmIcon,
  inputs: z.object({
    chargeId: z
      .string()
      .min(1)
      .describe('The Affirm charge ARI to refund, e.g. CPDZ-ANRU. Not a Shopify order number.'),
    amountMinor: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'Amount in INTEGER MINOR UNITS (cents) — 2500 is $25.00, never 25. Omit to refund the ' +
          'ENTIRE remaining balance, which is a much larger act than a partial refund; do not ' +
          'omit it by accident.'
      ),
    referenceId: z
      .string()
      .min(1)
      .max(128)
      .optional()
      .describe(
        'Your own reconciliation identifier, 1–128 characters. It also forms part of the ' +
          'idempotency key: use the SAME one when retrying a refund you are not sure landed, ' +
          'and a DIFFERENT one only when you genuinely mean a second, separate refund.'
      ),
  }),
  outputs: writeResultSchema,
  // ⚠️ SYNTHETIC — there is no sandbox, so no refund response has ever been
  // observed. Documented shape, invented values. See ./shared/schemas.ts.
  exampleOutput: exampleRefundResult,
  config: { requiresConnection: true, timeout: 30000 },
  execute: refundAffirmChargeExecute,
  // Its own toolset, and narrower than the reads: `chat` and `email` are off —
  // knowing an order number must never authorise refunding a loan, and an email
  // is not proof of who sent it — and so is `builder`, because there is no
  // sandbox and therefore no such thing as trying this out. Nothing is
  // `externalSafe`.
  agent: { toolsetSlug: 'affirm.write', surfaces: ['internal'] },
})
