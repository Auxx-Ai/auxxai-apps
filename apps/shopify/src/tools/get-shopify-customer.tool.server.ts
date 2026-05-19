// src/tools/get-shopify-customer.tool.server.ts

import type { ToolExecuteContext } from '@auxx/sdk/tools'
import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import {
  gidToNumeric,
  mapCustomerWithAddress,
  type MappedShopifyCustomerWithAddress,
} from './shared/map-customer'
import { resolveContactRef } from './shared/resolve-contact-ref'

interface GetShopifyCustomerInput {
  shopifyCustomerId: string
}

interface GetShopifyCustomerOutput {
  found: boolean
  customer: (MappedShopifyCustomerWithAddress & { auxxRecordId: string | null }) | null
  notImportedReason?: 'NOT_IMPORTED'
}

export default async function getShopifyCustomer(
  input: GetShopifyCustomerInput,
  ctx: ToolExecuteContext
): Promise<GetShopifyCustomerOutput> {
  const { token, shopDomain } = getShopifyConnection()
  const numericId = gidToNumeric(input.shopifyCustomerId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await shopifyApi<{ customer: any }>(
    shopDomain,
    token,
    `/customers/${encodeURIComponent(numericId)}.json`
  )
  if (!result.customer) return { found: false, customer: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderResult = await shopifyApi<{ orders: any[] }>(
    shopDomain,
    token,
    `/customers/${encodeURIComponent(numericId)}/orders.json`,
    { qs: { status: 'any', limit: '5', order: 'created_at desc' } }
  )

  const defaultCurrency = await getDefaultCurrency(shopDomain, token)
  const auxxRecordId = await resolveContactRef(ctx, numericId)

  return {
    found: true,
    customer: {
      ...mapCustomerWithAddress(result.customer, defaultCurrency, orderResult.orders ?? []),
      auxxRecordId,
    },
    notImportedReason: auxxRecordId ? undefined : 'NOT_IMPORTED',
  }
}

async function getDefaultCurrency(shopDomain: string, token: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shop = await shopifyApi<{ shop: any }>(shopDomain, token, '/shop.json')
  return shop.shop?.currency ?? 'USD'
}
