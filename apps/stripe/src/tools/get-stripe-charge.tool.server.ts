// src/tools/get-stripe-charge.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripeApi } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCharge, mapStripeCharge } from './shared/map-stripe-charge'

interface GetStripeChargeInput {
  chargeId: string
}

interface GetStripeChargeOutput {
  charge: MappedStripeCharge
}

export default async function getStripeCharge(
  input: GetStripeChargeInput,
  ctx: ToolExecuteContext
): Promise<GetStripeChargeOutput> {
  const apiKey = getStripeApiKey()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await stripeApi<any>('GET', `/charges/${input.chargeId}`, apiKey)
  return { charge: await mapStripeCharge(raw, ctx) }
}
