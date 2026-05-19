// src/tools/search-shopify-products.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import { mapProductSummary, type ProductSummary } from './shared/map-product'

interface SearchShopifyProductsInput {
  query?: string
  status?: 'active' | 'draft' | 'archived'
  vendor?: string
  productType?: string
  limit?: number
}

interface SearchShopifyProductsOutput {
  products: ProductSummary[]
  truncated: boolean
}

export default async function searchShopifyProducts(
  input: SearchShopifyProductsInput
): Promise<SearchShopifyProductsOutput> {
  const { token, shopDomain } = getShopifyConnection()
  const limit = input.limit ?? 10

  const qs: Record<string, string> = {
    // Pull one extra so we can detect truncation without a second roundtrip.
    limit: String(Math.min(limit + 1, 250)),
  }
  if (input.status) qs.status = input.status
  if (input.vendor) qs.vendor = input.vendor
  if (input.productType) qs.product_type = input.productType
  if (input.query) qs.title = input.query

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await shopifyApi<{ products: any[] }>(shopDomain, token, '/products.json', { qs })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = await shopifyApi<{ shop: any }>(shopDomain, token, '/shop.json')
  const defaultCurrency = shop.shop?.currency ?? 'USD'

  const all = result.products ?? []
  const truncated = all.length > limit
  const products = (truncated ? all.slice(0, limit) : all).map((p) =>
    mapProductSummary(p, defaultCurrency)
  )

  return { products, truncated }
}
