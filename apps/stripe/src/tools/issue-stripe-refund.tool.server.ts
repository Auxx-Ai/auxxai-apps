// src/tools/issue-stripe-refund.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi, toStripeMetadata } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeRefund, mapStripeRefund } from './shared/map-stripe-refund'

interface IssueStripeRefundInput {
  chargeId: string
  amount?: number
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  metadata?: { key: string; value: string }[]
}

interface IssueStripeRefundOutput {
  refund: MappedStripeRefund
}

export default async function issueStripeRefund(
  input: IssueStripeRefundInput,
  ctx: ToolExecuteContext
): Promise<IssueStripeRefundOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = { charge: input.chargeId }
  if (input.amount) body.amount = input.amount
  if (input.reason) body.reason = input.reason
  if (input.metadata?.length) body.metadata = toStripeMetadata(input.metadata)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('POST', '/refunds', apiKey, { body })

  // Resolve nested customer ref from the parent charge.
  let customerHint: unknown = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const charge = await stripeApi<any>('GET', `/charges/${input.chargeId}`, apiKey)
    customerHint = charge.customer
  } catch {
    // Best-effort.
  }

  return { refund: await mapStripeRefund(raw, ctx, customerHint) }
}
