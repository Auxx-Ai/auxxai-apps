// src/tools/shared/map-product.ts

/**
 * Tool-surface mappers for Shopify Product / ProductVariant (REST).
 *
 * See plans/kopilot/apps/shopify-overhaul.md §7.
 */
import { locationGid, productGid, variantGid } from './map-customer'

export interface ProductSummary {
  shopifyProductId: string
  title: string
  handle: string
  status: string
  vendor: string | null
  productType: string | null
  tags: string[]
  totalInventory: number | null
  priceRange: {
    min: { amount: string; currencyCode: string }
    max: { amount: string; currencyCode: string }
  }
  variantsCount: number
  featuredImageUrl: string | null
}

export interface VariantInventoryRow {
  shopifyVariantId: string
  title: string
  sku: string | null
  available: number | null
  locations: Array<{
    locationId: string
    name: string
    available: number | null
  }>
}

export interface ProductInventory {
  shopifyProductId: string
  title: string
  totalInventory: number | null
  variants: VariantInventoryRow[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProductSummary(p: any, defaultCurrency: string): ProductSummary {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variants: any[] = Array.isArray(p.variants) ? p.variants : []
  const prices = variants
    .map((v) => parseFloat(String(v.price ?? '0')))
    .filter((n) => !Number.isNaN(n))
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0
  const totalInventory = variants.reduce<number | null>((sum, v) => {
    const q = typeof v.inventory_quantity === 'number' ? v.inventory_quantity : null
    if (sum === null && q === null) return null
    return (sum ?? 0) + (q ?? 0)
  }, null)

  return {
    shopifyProductId: productGid(p.id),
    title: p.title ?? '',
    handle: p.handle ?? '',
    status: p.status ?? 'active',
    vendor: p.vendor || null,
    productType: p.product_type || null,
    tags: parseTags(p.tags),
    totalInventory,
    priceRange: {
      min: { amount: min.toFixed(2), currencyCode: defaultCurrency },
      max: { amount: max.toFixed(2), currencyCode: defaultCurrency },
    },
    variantsCount: variants.length,
    featuredImageUrl: p.image?.src ?? null,
  }
}

export function mapProductInventory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inventoryLevelsByItemId: Map<string, any[]>,
  locationNameById: Map<string, string>
): ProductInventory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variants: any[] = Array.isArray(p.variants) ? p.variants : []

  const variantRows: VariantInventoryRow[] = variants.map((v) => {
    const itemId = v.inventory_item_id ? String(v.inventory_item_id) : null
    const levels = itemId ? (inventoryLevelsByItemId.get(itemId) ?? []) : []
    return {
      shopifyVariantId: variantGid(v.id),
      title: v.title ?? '',
      sku: v.sku || null,
      available: typeof v.inventory_quantity === 'number' ? v.inventory_quantity : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      locations: levels.map((l: any) => ({
        locationId: locationGid(l.location_id),
        name: locationNameById.get(String(l.location_id)) ?? '',
        available: typeof l.available === 'number' ? l.available : null,
      })),
    }
  })

  const totalInventory = variantRows.reduce<number | null>((sum, v) => {
    if (sum === null && v.available === null) return null
    return (sum ?? 0) + (v.available ?? 0)
  }, null)

  return {
    shopifyProductId: productGid(p.id),
    title: p.title ?? '',
    totalInventory,
    variants: variantRows,
  }
}

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean)
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}
