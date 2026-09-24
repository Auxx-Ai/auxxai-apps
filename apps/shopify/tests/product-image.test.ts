// apps/shopify/tests/product-image.test.ts

import { describe, expect, it } from 'vitest'
import { toProductRecord } from '../src/shopify.connector.server'

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

type Product = Parameters<typeof toProductRecord>[0]

function project(product: unknown) {
  return toProductRecord(product as Product, new Map())
}

describe('product stream image URLs', () => {
  it('carries the featured image and each variant image verbatim, falling back to the featured image', () => {
    const fields = project(RAW_PRODUCT).fields as Record<string, unknown>
    expect(fields.imageUrl).toBe(FEATURED)
    const variants = fields.variants as Array<Record<string, unknown>>
    expect(variants.map((v) => v.imageUrl)).toEqual([FEATURED, BLUE, FEATURED, FEATURED])
  })

  it('emits null when the product has no image', () => {
    const fields = project({ ...RAW_PRODUCT, image: null, images: [] }).fields as Record<
      string,
      unknown
    >
    expect(fields.imageUrl).toBeNull()
  })
})
