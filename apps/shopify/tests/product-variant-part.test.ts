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
        { sourcePath: 'unitCost', target: 'part_channel_cost' },
        { sourcePath: 'partKind', target: 'part_kind', mergeStrategy: 'fill_blank' },
        { sourcePath: 'sellable', target: 'part_sellable', mergeStrategy: 'fill_blank' },
        { sourcePath: 'price', appField: 'price' },
      ])
    )
  })

  it('projects cost per item from a batched inventory_items lookup, null when absent', async () => {
    const product = {
      ...RAW_PRODUCT,
      variants: [
        { id: 11, sku: 'A', title: 'A', price: '1.00', inventory_item_id: 501 },
        { id: 12, sku: 'B', title: 'B', price: '1.00', inventory_item_id: 502 },
        { id: 13, sku: 'C', title: 'C', price: '1.00', inventory_item_id: null },
      ],
    }
    const urls: string[] = []
    vi.stubGlobal('fetch', (url: string) => {
      urls.push(url)
      const body = url.includes('/inventory_items.json')
        ? {
            inventory_items: [
              { id: 501, cost: '12.345' },
              { id: 502, cost: null },
            ],
          }
        : { products: [product] }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve(body),
      })
    })

    const result = await shopifySync({
      streamKey: 'product',
      mode: 'backfill',
      state: {},
      connection,
    } as never)

    const variants = (result.records[0]!.fields as Record<string, unknown>).variants as Array<
      Record<string, unknown>
    >
    expect(variants.map((v) => v.unitCost)).toEqual([1235, null, null])
    const costCalls = urls.filter((u) => u.includes('/inventory_items.json'))
    expect(costCalls).toHaveLength(1)
    expect(new URL(costCalls[0]!).searchParams.get('ids')).toBe('501,502')
  })

  it('splits more than 100 inventory item ids into batches of 100', async () => {
    const product = {
      ...RAW_PRODUCT,
      variants: Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        sku: `S${i}`,
        title: `V${i}`,
        price: '1.00',
        inventory_item_id: 1000 + i,
      })),
    }
    const idBatches: string[][] = []
    vi.stubGlobal('fetch', (url: string) => {
      let body: unknown = { products: [product] }
      if (url.includes('/inventory_items.json')) {
        const ids = new URL(url).searchParams.get('ids')!.split(',')
        idBatches.push(ids)
        body = { inventory_items: ids.map((id) => ({ id: Number(id), cost: '2.00' })) }
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: () => Promise.resolve(body),
      })
    })

    const result = await shopifySync({
      streamKey: 'product',
      mode: 'backfill',
      state: {},
      connection,
    } as never)

    expect(idBatches.map((b) => b.length)).toEqual([100, 50])
    const variants = (result.records[0]!.fields as Record<string, unknown>).variants as Array<
      Record<string, unknown>
    >
    expect(variants.every((v) => v.unitCost === 200)).toBe(true)
  })

  it('retries the page from the same cursor when the cost lookup is throttled', async () => {
    vi.stubGlobal('fetch', (url: string) =>
      Promise.resolve(
        url.includes('/inventory_items.json')
          ? { ok: false, status: 429, headers: { get: () => '2' }, json: () => Promise.resolve({}) }
          : {
              ok: true,
              status: 200,
              headers: { get: () => null },
              json: () =>
                Promise.resolve({
                  products: [
                    { ...RAW_PRODUCT, variants: [{ id: 1, price: '1.00', inventory_item_id: 7 }] },
                  ],
                }),
            }
      )
    )

    const result = await shopifySync({
      streamKey: 'product',
      mode: 'incremental',
      state: { cursor: 'abc' },
      connection,
    } as never)

    expect(result.records).toEqual([])
    expect(result.rateLimited).toEqual({ retryAfterMs: 2000 })
    expect(result.nextState.cursor).toBe('abc')
  })
})
