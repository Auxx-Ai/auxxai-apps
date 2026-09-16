// src/tools/void_affirm_charge.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import affirmIcon from '../assets/affirm.png'
import voidAffirmChargeExecute from './void_affirm_charge.tool.server'
import { exampleVoidResult, writeResultSchema } from './shared/schemas'

/**
 * ⚠️ A WRITE against a live lender. Member of `affirm.write`, never of
 * `affirm.settlements`.
 */
export const voidAffirmChargeTool = defineTool({
  id: 'void_affirm_charge',
  name: 'Void Affirm charge',
  description:
    'Void an Affirm charge, cancelling the customer’s loan before it settles. ' +
    '⚠️ THIS CANCELS A REAL CUSTOMER’S CONSUMER LOAN and CANNOT BE UNDONE — a voided charge ' +
    'is not re-openable, the customer has to go through Affirm checkout again. ' +
    'THIS DOES NOT TELL SHOPIFY. The void reaches Affirm and nothing else, so the Shopify ' +
    'order’s payment state is unchanged and must be reconciled by hand. ' +
    'Void is for a charge that has NOT been captured. If it has already been captured, the ' +
    'operation you want is a REFUND (refund_affirm_charge) — Affirm answers 409 and says so, ' +
    'and that boundary is Affirm’s to decide, not something to guess at by trying both. ' +
    'amountMinor is INTEGER MINOR UNITS (cents) and is for split-capture merchants ONLY — ' +
    'omit it for a normal full void. ' +
    'Every call sends an Idempotency-Key derived from the operation, charge, amount and ' +
    'referenceId, so re-issuing the SAME request is processed once; a different referenceId ' +
    'or amount is a different key and is a SECOND void attempt. ' +
    'Affirm reports NO amount on a void, so read the charge with get_affirm_charge first if ' +
    'you need to know what is being cancelled.',
  icon: affirmIcon,
  inputs: z.object({
    chargeId: z
      .string()
      .min(1)
      .describe('The Affirm charge ARI to void, e.g. CPDZ-ANRU. Not a Shopify order number.'),
    amountMinor: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        'SPLIT-CAPTURE MERCHANTS ONLY. Amount in INTEGER MINOR UNITS (cents) — 2500 is $25.00, ' +
          'never 25. Omit this for a normal full void.'
      ),
    referenceId: z
      .string()
      .min(1)
      .max(128)
      .optional()
      .describe(
        'Your own reconciliation identifier, 1–128 characters. It also forms part of the ' +
          'idempotency key: use the SAME one when retrying a void you are not sure landed.'
      ),
  }),
  outputs: writeResultSchema,
  // ⚠️ SYNTHETIC — there is no sandbox, so no void response has ever been
  // observed. Documented shape, invented values. See ./shared/schemas.ts.
  exampleOutput: exampleVoidResult,
  config: { requiresConnection: true, timeout: 30000 },
  execute: voidAffirmChargeExecute,
  // Its own toolset, narrower than the reads: no `chat`, no `email`, no
  // `builder`, nothing `externalSafe`. See ./toolsets.ts.
  agent: { toolsetSlug: 'affirm.write', surfaces: ['internal'] },
})
