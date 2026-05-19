// src/tools/list-stripe-charges.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'
import { type MappedStripeCharge, mapStripeCharge } from './shared/map-stripe-charge'
import { unixFromIso } from './shared/iso'

interface ListStripeChargesInput {
  createdAfter?: string
  createdBefore?: string
  limit?: number
}

interface ListStripeChargesOutput {
  charges: MappedStripeCharge[]
  truncated: boolean
}

export default async function listStripeCharges(
  input: ListStripeChargesInput,
  ctx: ToolExecuteContext
): Promise<ListStripeChargesOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 50

  const qs: Record<string, string> = {}
  if (input.createdAfter) qs['created[gte]'] = String(unixFromIso(input.createdAfter))
  if (input.createdBefore) qs['created[lt]'] = String(unixFromIso(input.createdBefore))

  const { data, truncated } = await stripePaginatedGet('/charges', apiKey, qs, {
    returnAll: false,
    limit,
  })

  const charges = await Promise.all(data.map((raw) => mapStripeCharge(raw, ctx)))
  return { charges, truncated }
}
