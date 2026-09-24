// src/graphql/product.ts

import type { RawProduct, RawProductImage, RawVariant } from '../shopify.connector.server'
import { type GraphqlPage, type ShopifyHttp, shopifyGraphql } from './client'
import { legacyId } from './legacy-id'
import type { GraphqlConnection } from './paged'

/** Variants per product per request; the rest are paged by `completeVariants`. */
const VARIANT_PAGE = 100

const VARIANT_FIELDS = `fragment VariantFields on ProductVariant {
  legacyResourceId sku title price inventoryQuantity position updatedAt
  selectedOptions { name value }
  inventoryItem { legacyResourceId requiresShipping unitCost { amount } }
  media(first: 1) { nodes { ... on MediaImage { image { url } } } }
}`

const PRODUCT_FIELDS = `fragment ProductFields on Product {
  id legacyResourceId title descriptionHtml vendor productType handle status tags
  createdAt updatedAt publishedAt
  featuredMedia { ... on MediaImage { image { url } } }
  variants(first: ${VARIANT_PAGE}) {
    pageInfo { hasNextPage endCursor }
    nodes { ...VariantFields }
  }
}`

/** Products page by id. `$query` is always null: any filter here archives what it hides (§6.3). */
export const PRODUCTS_QUERY = `query ProductsPage($first: Int!, $after: String, $query: String) {
  products(first: $first, after: $after, query: $query, sortKey: ID) {
    pageInfo { hasNextPage endCursor }
    nodes { ...ProductFields }
  }
}
${PRODUCT_FIELDS}
${VARIANT_FIELDS}`

const PRODUCT_VARIANTS_QUERY = `query ProductVariants($id: ID!, $after: String) {
  product(id: $id) {
    variants(first: ${VARIANT_PAGE}, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { ...VariantFields }
    }
  }
}
${VARIANT_FIELDS}`

/** The product owning an inventory item: the `inventory_levels/update` webhook path. */
export const STEERED_PRODUCT_QUERY = `query SteeredProduct($id: ID!) {
  inventoryItem(id: $id) { variant { product { ...ProductFields } } }
}
${PRODUCT_FIELDS}
${VARIANT_FIELDS}`

interface GqlImageMedia {
  image?: { url?: string | null } | null
}

export interface GqlVariant {
  legacyResourceId: string
  sku?: string | null
  title?: string | null
  price?: string | null
  inventoryQuantity?: number | null
  position?: number | null
  updatedAt: string
  selectedOptions?: Array<{ name: string; value: string }> | null
  inventoryItem?: {
    legacyResourceId: string
    requiresShipping?: boolean | null
    unitCost?: { amount?: string | null } | null
  } | null
  media?: { nodes: GqlImageMedia[] } | null
}

export interface GqlProduct {
  id: string
  legacyResourceId: string
  title?: string | null
  descriptionHtml?: string | null
  vendor?: string | null
  productType?: string | null
  handle?: string | null
  status: string
  tags?: string[] | null
  createdAt: string
  updatedAt: string
  publishedAt?: string | null
  featuredMedia?: GqlImageMedia | null
  variants: GraphqlConnection<GqlVariant>
}

export interface ProductsData {
  products: GraphqlConnection<GqlProduct>
}

export interface SteeredProductData {
  inventoryItem?: { variant?: { product?: GqlProduct | null } | null } | null
}

interface ProductVariantsData {
  product?: { variants: GraphqlConnection<GqlVariant> } | null
}

const PRODUCT_STATUS: Record<string, string> = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DRAFT: 'draft',
  UNLISTED: 'unlisted',
}

/** REST status for a GraphQL `ProductStatus`; an unknown value throws rather than archiving. */
function productStatus(status: string): string {
  const mapped = PRODUCT_STATUS[status]
  if (!mapped) throw new Error(`shopify: unknown product status "${status}"`)
  return mapped
}

function imageUrl(media: GqlImageMedia | null | undefined): string | null {
  return media?.image?.url ?? null
}

/**
 * Page every product's variants beyond the first 100 so no product is projected truncated.
 * A product deleted mid-crawl is dropped (the snapshot archives it); a throttle retries the page.
 */
export async function completeVariants(
  products: GqlProduct[],
  http: ShopifyHttp,
): Promise<GraphqlPage<GqlProduct[]>> {
  const out: GqlProduct[] = []
  for (const product of products) {
    const nodes = [...product.variants.nodes]
    let { pageInfo } = product.variants
    let deleted = false
    while (pageInfo.hasNextPage) {
      if (!pageInfo.endCursor) throw new Error('shopify: variants have a next page but no cursor')
      const res = await shopifyGraphql<ProductVariantsData>(http, PRODUCT_VARIANTS_QUERY, {
        id: product.id,
        after: pageInfo.endCursor,
      })
      if (!res.ok) return res
      if (!res.data.product) {
        deleted = true
        break
      }
      nodes.push(...res.data.product.variants.nodes)
      pageInfo = res.data.product.variants.pageInfo
    }
    if (!deleted) out.push({ ...product, variants: { nodes, pageInfo } })
  }
  return { ok: true, data: out }
}

/** Adapt a fully-paged GraphQL product into the REST shape `toProductRecord` projects. */
export function toRawProduct(node: GqlProduct): RawProduct {
  // Image ids are adapter-local join keys (variant → image); the projection never emits them.
  const images: RawProductImage[] = []
  const imageFor = (src: string | null): RawProductImage | null => {
    if (!src) return null
    const found = images.find((img) => img.src === src)
    if (found) return found
    const image = { id: images.length + 1, src }
    images.push(image)
    return image
  }
  const image = imageFor(imageUrl(node.featuredMedia))

  const variants: RawVariant[] = node.variants.nodes.map((v) => {
    const options = v.selectedOptions ?? []
    return {
      id: legacyId(v.legacyResourceId),
      sku: v.sku ?? null,
      title: v.title ?? null,
      price: v.price ?? null,
      inventory_quantity: v.inventoryQuantity ?? null,
      inventory_item_id: v.inventoryItem ? legacyId(v.inventoryItem.legacyResourceId) : null,
      position: v.position ?? null,
      option1: options[0]?.value ?? null,
      option2: options[1]?.value ?? null,
      option3: options[2]?.value ?? null,
      image_id: imageFor(imageUrl(v.media?.nodes[0]))?.id ?? null,
      requires_shipping: v.inventoryItem?.requiresShipping ?? null,
      updated_at: v.updatedAt,
    }
  })

  return {
    id: legacyId(node.legacyResourceId),
    title: node.title ?? null,
    body_html: node.descriptionHtml ?? null,
    vendor: node.vendor ?? null,
    product_type: node.productType ?? null,
    handle: node.handle ?? null,
    status: productStatus(node.status),
    // REST joins tags with ", ".
    tags: (node.tags ?? []).join(', '),
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    published_at: node.publishedAt ?? null,
    image,
    images,
    variants,
  }
}

/** Each variant's "cost per item" keyed by inventory item id, as `toProductRecord` reads it. */
export function inventoryItemCosts(node: GqlProduct): Map<string, string | null> {
  const costs = new Map<string, string | null>()
  for (const v of node.variants.nodes) {
    if (!v.inventoryItem) continue
    costs.set(
      String(legacyId(v.inventoryItem.legacyResourceId)),
      v.inventoryItem.unitCost?.amount ?? null,
    )
  }
  return costs
}

/** One crawled product: the REST shape plus its cost map, with the paged-fetch watermark key. */
export interface ProductRow {
  updated_at: string
  product: RawProduct
  costs: ReadonlyMap<string, string | null>
}

export function toProductRow(node: GqlProduct): ProductRow {
  return {
    updated_at: node.updatedAt,
    product: toRawProduct(node),
    costs: inventoryItemCosts(node),
  }
}
