// src/tools/get-stripe-refund.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeRefund, mapStripeRefund } from './shared/map-stripe-refund'

interface GetStripeRefundInput {
  refundId: string
}

interface GetStripeRefundOutput {
  refund: MappedStripeRefund
}

export default async function getStripeRefund(
  input: GetStripeRefundInput,
  ctx: ToolExecuteContext
): Promise<GetStripeRefundOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('GET', `/refunds/${input.refundId}`, apiKey)

  // Stripe refunds embed `charge` (id) but not `customer`. Fetch the
  // parent charge to populate the nested customer ref.
  let customerHint: unknown = null
  const chargeId = typeof raw.charge === 'string' ? raw.charge : raw.charge?.id
  if (chargeId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const charge = await stripeApi<any>('GET', `/charges/${chargeId}`, apiKey)
      customerHint = charge.customer
    } catch {
      // Best-effort: missing parent charge surfaces as customer null.
    }
  }

  return { refund: await mapStripeRefund(raw, ctx, customerHint) }
}
