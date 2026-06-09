// src/tools/find-shopify-customer.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import { mapCustomer, type MappedShopifyCustomer } from './shared/map-customer'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface FindShopifyCustomerInput {
  email?: string
  phone?: string
}

interface FindShopifyCustomerOutput {
  found: boolean
  customer: (MappedShopifyCustomer & { auxxRecordId: string | null }) | null
  notImportedReason?: 'NOT_IMPORTED'
}

export default async function findShopifyCustomer(
  input: FindShopifyCustomerInput
): Promise<FindShopifyCustomerOutput> {
  // XOR check covers the .refine() stripped by the JSON Schema converter.
  if (Number(!!input.email) + Number(!!input.phone) !== 1) {
    const err = new Error('Provide exactly one of email or phone.') as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  }

  const { token, shopDomain } = getShopifyConnection()
  const queryParts: string[] = []
  if (input.email) queryParts.push(`email:${input.email}`)
  if (input.phone) queryParts.push(`phone:${input.phone}`)

  const result = await shopifyApi<{ customers: unknown[] }>(
    shopDomain,
    token,
    '/customers/search.json',
    { qs: { query: queryParts.join(' '), limit: '1' } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (result.customers ?? [])[0] as any
  if (!raw) return { found: false, customer: null }

  const defaultCurrency = await getDefaultCurrency(shopDomain, token)
  const auxxRecordId = await resolveContactRef(raw.id)

  return {
    found: true,
    customer: {
      ...mapCustomer(raw, defaultCurrency),
      auxxRecordId,
    },
    notImportedReason: auxxRecordId ? undefined : 'NOT_IMPORTED',
  }
}

// Cached single-call helper used across customer/order tools.
async function getDefaultCurrency(shopDomain: string, token: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = await shopifyApi<{ shop: any }>(shopDomain, token, '/shop.json')
  return shop.shop?.currency ?? 'USD'
}
