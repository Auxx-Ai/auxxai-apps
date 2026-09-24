// apps/shopify/tests/product-variant-part.test.ts

import { describe, expect, it } from 'vitest'
import { shopifyConnector } from '../src/shopify.connector'
import { toProductRecord } from '../src/shopify.connector.server'

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

type Product = Parameters<typeof toProductRecord>[0]

function projectVariants(product: unknown, costs = new Map<string, string | null>()) {
  const fields = toProductRecord(product as Product, costs).fields as Record<string, unknown>
  return fields.variants as Array<Record<string, unknown>>
}

function productMappings() {
  const stream = shopifyConnector.streams.find((s) => s.key === 'product')
  return stream?.mappings ?? []
}

describe('product variants -> part', () => {
  it('derives the part kind from requires_shipping and marks every variant sellable', () => {
    const variants = projectVariants(RAW_PRODUCT)
    expect(variants.map((v) => v.requiresShipping)).toEqual([false, true, null])
    expect(variants.map((v) => v.partKind)).toEqual(['service', 'finished_good', 'finished_good'])
    expect(variants.map((v) => v.sellable)).toEqual([true, true, true])
    expect(variants.map((v) => v.price)).toEqual([9900, 1050, 100])
  })

  it('maps price, kind and sellable onto the part, with no catalog item mapping', () => {
    const mappings = productMappings()
    expect(
      mappings.some((m) => (m.target as { entityKind: string }).entityKind === 'catalog_item'),
    ).toBe(false)

    const part = mappings.find((m) => (m.target as { entityKind: string }).entityKind === 'part')
    const fields = part?.fields ?? []
    expect(fields).toEqual(
      expect.arrayContaining([
        { sourcePath: 'price', target: 'part_sell_price' },
        { sourcePath: 'unitCost', target: 'part_channel_cost' },
        { sourcePath: 'partKind', target: 'part_kind', mergeStrategy: 'fill_blank' },
        { sourcePath: 'sellable', target: 'part_sellable', mergeStrategy: 'fill_blank' },
        { sourcePath: 'price', appField: 'price' },
      ]),
    )
  })

  it('projects cost per item by inventory item id, null when absent', () => {
    const product = {
      ...RAW_PRODUCT,
      variants: [
        { id: 11, sku: 'A', title: 'A', price: '1.00', inventory_item_id: 501 },
        { id: 12, sku: 'B', title: 'B', price: '1.00', inventory_item_id: 502 },
        { id: 13, sku: 'C', title: 'C', price: '1.00', inventory_item_id: null },
      ],
    }
    const costs = new Map<string, string | null>([
      ['501', '12.345'],
      ['502', null],
    ])
    expect(projectVariants(product, costs).map((v) => v.unitCost)).toEqual([1235, null, null])
  })
})
