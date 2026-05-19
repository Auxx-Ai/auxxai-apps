// src/tools/list-stripe-products.tool.server.ts

import { stripePaginatedGet } from '../blocks/stripe/shared/stripe-api'
import { getStripeApiKey } from './shared/connection'

interface ListStripeProductsInput {
  active?: boolean
  limit?: number
}

interface ListStripeProductsOutput {
  products: {
    productId: string
    name: string
    description: string | null
    active: boolean
  }[]
  truncated: boolean
}

export default async function listStripeProducts(
  input: ListStripeProductsInput
): Promise<ListStripeProductsOutput> {
  const apiKey = getStripeApiKey()
  const limit = input.limit ?? 50
  const active = input.active ?? true

  const { data, truncated } = await stripePaginatedGet(
    '/products',
    apiKey,
    { active: String(active) },
    { returnAll: false, limit }
  )

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: data.map((p: any) => ({
      productId: p.id,
      name: p.name ?? '',
      description: p.description ?? null,
      active: Boolean(p.active),
    })),
    truncated,
  }
}
