// apps/shopify/tests/product-variant-part.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest'
import { shopifyConnector } from '../src/shopify.connector'
import shopifySync from '../src/shopify.connector.server'

const RAW_PRODUCT = {
  id: 987654321,
  title: 'Installation',
  body_html: null,
  vendor: 'Acme',
  product_type: 'Service',
  handle: 'installation',
  status: 'active',
  tags: '',
  created_at: '2024-01-05T08:00:00Z',
  updated_at: '2024-01-10T08:00:00Z',
  published_at: null,
  image: null,
  images: [],
  variants: [
    { id: 11, sku: 'INSTALL', title: 'Default Title', price: '99.00', requires_shipping: false },
    { id: 12, sku: 'SHELF', title: 'Shelf', price: '10.50', requires_shipping: true },
    { id: 13, sku: 'LEGACY', title: 'Legacy', price: '1.00' },
  ],
}

const connection = {
  value: 'shpat_test',
  metadata: { connectionVariables: { shop: 'test-shop' } },
}

function productMappings() {
  const stream = shopifyConnector.streams.find((s) => s.key === 'product')
  return stream?.mappings ?? []
}

describe('product variants -> part', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('derives the part kind from requires_shipping and marks every variant sellable', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve({ products: [RAW_PRODUCT] }),
      })
    )

    const result = await shopifySync({
      streamKey: 'product',
      mode: 'backfill',
      state: {},
      connection,
    } as never)

    const variants = (result.records[0]!.fields as Record<string, unknown>).variants as Array<
      Record<string, unknown>
    >
    expect(variants.map((v) => v.requiresShipping)).toEqual([false, true, null])
    expect(variants.map((v) => v.partKind)).toEqual(['service', 'finished_good', 'finished_good'])
    expect(variants.map((v) => v.sellable)).toEqual([true, true, true])
    expect(variants.map((v) => v.price)).toEqual([9900, 1050, 100])
  })

  it('maps price, kind and sellable onto the part, with no catalog item mapping', () => {
    const mappings = productMappings()
    expect(
      mappings.some((m) => (m.target as { entityKind: string }).entityKind === 'catalog_item')
    ).toBe(false)

    const part = mappings.find((m) => (m.target as { entityKind: string }).entityKind === 'part')
    const fields = part?.fields ?? []
    expect(fields).toEqual(
      expect.arrayContaining([
        { sourcePath: 'price', target: 'part_sell_price' },
        { sourcePath: 'partKind', target: 'part_kind', mergeStrategy: 'fill_blank' },
        { sourcePath: 'sellable', target: 'part_sellable', mergeStrategy: 'fill_blank' },
        { sourcePath: 'price', appField: 'price' },
      ])
    )
  })
})
