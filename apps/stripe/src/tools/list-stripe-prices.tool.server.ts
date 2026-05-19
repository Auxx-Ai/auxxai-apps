// src/tools/list-stripe-prices.tool.server.ts

import { stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'

interface ListStripePricesInput {
  productId?: string
  active?: boolean
  limit?: number
}

interface MappedPrice {
  priceId: string
  productId: string
  nickname: string | null
  currency: string
  unitAmount: number | null
  recurring: { interval: 'day' | 'week' | 'month' | 'year'; intervalCount: number } | null
  active: boolean
}

interface ListStripePricesOutput {
  prices: MappedPrice[]
  truncated: boolean
}

export default async function listStripePrices(
  input: ListStripePricesInput
): Promise<ListStripePricesOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 50
  const active = input.active ?? true

  const qs: Record<string, string> = { active: String(active) }
  if (input.productId) qs.product = input.productId

  const { data, truncated } = await stripePaginatedGet('/prices', apiKey, qs, {
    returnAll: false,
    limit,
  })

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prices: data.map((p: any) => ({
      priceId: p.id,
      productId: typeof p.product === 'string' ? p.product : (p.product?.id ?? ''),
      nickname: p.nickname ?? null,
      currency: p.currency ?? '',
      unitAmount: typeof p.unit_amount === 'number' ? p.unit_amount : null,
      recurring: p.recurring
        ? {
            interval: p.recurring.interval as 'day' | 'week' | 'month' | 'year',
            intervalCount: Number(p.recurring.interval_count ?? 1),
          }
        : null,
      active: Boolean(p.active),
    })),
    truncated,
  }
}
