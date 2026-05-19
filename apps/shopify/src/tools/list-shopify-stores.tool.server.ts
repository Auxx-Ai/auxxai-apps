// src/tools/list-shopify-stores.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { locationGid, shopGid } from './shared/map-customer'
import { getShopifyConnection } from './shared/connection'

interface StoreRow {
  shopId: string
  name: string
  myshopifyDomain: string
  primaryDomain: string
  currencyCode: string
  ianaTimezone: string
  primaryLocationId: string | null
}

interface ListShopifyStoresOutput {
  stores: StoreRow[]
}

export default async function listShopifyStores(): Promise<ListShopifyStoresOutput> {
  const { token, shopDomain } = getShopifyConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shopResult = await shopifyApi<{ shop: any }>(shopDomain, token, '/shop.json')
  const shop = shopResult.shop ?? {}

  // The shop's primary location id is exposed indirectly — Shopify returns
  // it on `/locations.json` flagged with `primary_location_id` on the shop.
  // We use the shop's `primary_location_id` when present, otherwise fall
  // back to the first active location.
  let primaryLocationId: string | null = null
  if (shop.primary_location_id) {
    primaryLocationId = locationGid(shop.primary_location_id)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locResult = await shopifyApi<{ locations: any[] }>(shopDomain, token, '/locations.json', {
      qs: { limit: '1' },
    })
    const first = (locResult.locations ?? [])[0]
    if (first?.id) primaryLocationId = locationGid(first.id)
  }

  return {
    stores: [
      {
        shopId: shopGid(shop.id ?? 0),
        name: shop.name ?? '',
        myshopifyDomain: shop.myshopify_domain ?? shopDomain,
        primaryDomain: shop.domain ?? shop.myshopify_domain ?? shopDomain,
        currencyCode: shop.currency ?? '',
        ianaTimezone: shop.iana_timezone ?? '',
        primaryLocationId,
      },
    ],
  }
}
