// src/tools/get-product-inventory.tool.server.ts

import { shopifyApi } from '../blocks/shopify/shared/shopify-api'
import { getShopifyConnection } from './shared/connection'
import { gidToNumeric } from './shared/map-customer'
import { mapProductInventory, type ProductInventory } from './shared/map-product'

interface GetProductInventoryInput {
  shopifyProductId: string
}

export default async function getProductInventory(
  input: GetProductInventoryInput
): Promise<ProductInventory> {
  const { token, shopDomain } = getShopifyConnection()
  const numericId = gidToNumeric(input.shopifyProductId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productResult = await shopifyApi<{ product: any }>(
    shopDomain,
    token,
    `/products/${encodeURIComponent(numericId)}.json`
  )
  const product = productResult.product
  if (!product) {
    const err = new Error(`Product ${input.shopifyProductId} not found.`) as Error & {
      code: string
    }
    err.code = 'NOT_FOUND'
    throw err
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variants: any[] = Array.isArray(product.variants) ? product.variants : []
  const inventoryItemIds = variants
    .map((v) => v.inventory_item_id)
    .filter((id): id is number => typeof id === 'number')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inventoryLevelsByItemId = new Map<string, any[]>()
  const locationNameById = new Map<string, string>()

  if (inventoryItemIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const levelsResult = await shopifyApi<{ inventory_levels: any[] }>(
      shopDomain,
      token,
      '/inventory_levels.json',
      { qs: { inventory_item_ids: inventoryItemIds.join(','), limit: '250' } }
    )
    for (const lvl of levelsResult.inventory_levels ?? []) {
      const key = String(lvl.inventory_item_id)
      if (!inventoryLevelsByItemId.has(key)) inventoryLevelsByItemId.set(key, [])
      inventoryLevelsByItemId.get(key)!.push(lvl)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locsResult = await shopifyApi<{ locations: any[] }>(
      shopDomain,
      token,
      '/locations.json',
      { qs: { limit: '250' } }
    )
    for (const loc of locsResult.locations ?? []) {
      locationNameById.set(String(loc.id), loc.name ?? '')
    }
  }

  return mapProductInventory(product, inventoryLevelsByItemId, locationNameById)
}
