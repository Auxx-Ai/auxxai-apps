// apps/shopify/tests/product-image.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest'
import shopifySync from '../src/shopify.connector.server'

const FEATURED = 'https://cdn.shopify.com/s/files/1/0001/products/tee.jpg?v=1704873600'
const BLUE = 'https://cdn.shopify.com/s/files/1/0001/products/tee-blue.jpg?v=1704873999'

const RAW_PRODUCT = {
  id: 987654321,
  title: 'Tee',
  body_html: null,
  vendor: 'Acme',
  product_type: 'Apparel',
  handle: 'tee',
  status: 'active',
  tags: '',
  created_at: '2024-01-05T08:00:00Z',
  updated_at: '2024-01-10T08:00:00Z',
  published_at: null,
  image: { id: 1, src: FEATURED },
  images: [
    { id: 1, src: FEATURED },
    { id: 2, src: BLUE },
  ],
  variants: [
    { id: 11, sku: 'TEE-RED', title: 'Red', price: '10.00', image_id: 1 },
    { id: 12, sku: 'TEE-BLUE', title: 'Blue', price: '10.00', image_id: 2 },
    { id: 13, sku: 'TEE-GREEN', title: 'Green', price: '10.00', image_id: null },
    { id: 14, sku: 'TEE-GONE', title: 'Gone', price: '10.00', image_id: 999 },
  ],
}

function mockFetch(product: unknown) {
  return (url: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: () =>
        Promise.resolve(
          url.includes('/graphql.json')
            ? {
                data: {
                  inventoryItem: { variant: { product: { legacyResourceId: '987654321' } } },
                },
              }
            : url.includes('/products.json')
              ? { products: [product] }
              : { product },
        ),
    })
}

const connection = {
  value: 'shpat_test',
  metadata: { connectionVariables: { shop: 'test-shop' } },
}

describe('product stream image URLs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('carries the featured image and each variant image verbatim, query string included', async () => {
    vi.stubGlobal('fetch', mockFetch(RAW_PRODUCT))

    const result = await shopifySync({
      streamKey: 'product',
      mode: 'backfill',
      state: {},
      connection,
    } as never)

    const fields = result.records[0]!.fields as Record<string, unknown>
    expect(fields.imageUrl).toBe(FEATURED)
    const variants = fields.variants as Array<Record<string, unknown>>
    expect(variants.map((v) => v.imageUrl)).toEqual([FEATURED, BLUE, null, null])
  })

  it('emits null when the product has no image', async () => {
    vi.stubGlobal('fetch', mockFetch({ ...RAW_PRODUCT, image: null, images: [] }))

    const result = await shopifySync({
      streamKey: 'product',
      mode: 'backfill',
      state: {},
      connection,
    } as never)

    const fields = result.records[0]!.fields as Record<string, unknown>
    expect(fields.imageUrl).toBeNull()
  })

  it('projects the same image fields on the webhook-steered single-product fetch', async () => {
    vi.stubGlobal('fetch', mockFetch(RAW_PRODUCT))

    const result = await shopifySync({
      streamKey: 'product',
      mode: 'webhook',
      state: {},
      connection,
      triggerContext: { resourceId: '55555' },
    } as never)

    const fields = result.records[0]!.fields as Record<string, unknown>
    expect(fields.imageUrl).toBe(FEATURED)
    expect((fields.variants as Array<Record<string, unknown>>)[1]!.imageUrl).toBe(BLUE)
  })
})
