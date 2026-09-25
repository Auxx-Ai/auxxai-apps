// apps/shopify/tests/graphql-product.test.ts

import type { ConnectorQuery } from '@auxx/sdk/data-connectors'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type GqlProduct,
  type GqlVariant,
  inventoryItemCosts,
  toRawProduct,
} from '../src/graphql/product'
import shopifySync from '../src/shopify.connector.server'
import { connection, stubGraphql } from './graphql-test-support'

const FEATURED = 'https://cdn.shopify.com/s/files/1/0001/products/tee.jpg?v=1704873600'
const BLUE = 'https://cdn.shopify.com/s/files/1/0001/products/tee-blue.jpg?v=1704873999'

const variant = (id: number, over: Partial<GqlVariant> = {}): GqlVariant => ({
  legacyResourceId: String(id),
  sku: `SKU-${id}`,
  title: `V${id}`,
  price: '10.00',
  inventoryQuantity: 3,
  position: id,
  updatedAt: '2026-09-01T00:00:00Z',
  selectedOptions: [{ name: 'Color', value: `C${id}` }],
  inventoryItem: {
    legacyResourceId: String(500 + id),
    requiresShipping: true,
    unitCost: { amount: '2.50' },
  },
  media: { nodes: [] },
  ...over,
})

const page = <T>(nodes: T[], endCursor: string | null = null) => ({
  nodes,
  pageInfo: { hasNextPage: endCursor !== null, endCursor },
})

const product = (over: Partial<GqlProduct> = {}): GqlProduct => ({
  id: 'gid://shopify/Product/987654321',
  legacyResourceId: '987654321',
  title: 'Tee',
  descriptionHtml: '<p>Soft</p>',
  vendor: 'Acme',
  productType: 'Apparel',
  handle: 'tee',
  status: 'ACTIVE',
  tags: ['gift', 'summer'],
  createdAt: '2024-01-05T08:00:00Z',
  updatedAt: '2024-01-10T08:00:00Z',
  publishedAt: '2024-01-06T08:00:00Z',
  featuredMedia: { image: { url: FEATURED } },
  variants: page([variant(11)]),
  ...over,
})

const productsBody = (nodes: GqlProduct[], endCursor: string | null = null) => ({
  body: { data: { products: page(nodes, endCursor) } },
})

const variantsBody = (nodes: GqlVariant[], endCursor: string | null = null) => ({
  body: { data: { product: { variants: page(nodes, endCursor) } } },
})

const throttled = {
  body: {
    errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }],
    extensions: {
      cost: {
        requestedQueryCost: 300,
        throttleStatus: { currentlyAvailable: 100, restoreRate: 100 },
      },
    },
  },
}

function crawl(cursor?: unknown, query: ConnectorQuery = {}) {
  return shopifySync({ streamKey: 'product', query, cursor, config: {}, connection })
}

afterEach(() => vi.unstubAllGlobals())

describe('toRawProduct', () => {
  it('adapts a GraphQL product into the REST shape', () => {
    expect(toRawProduct(product())).toEqual({
      id: 987654321,
      title: 'Tee',
      body_html: '<p>Soft</p>',
      vendor: 'Acme',
      product_type: 'Apparel',
      handle: 'tee',
      status: 'active',
      tags: 'gift, summer',
      created_at: '2024-01-05T08:00:00Z',
      updated_at: '2024-01-10T08:00:00Z',
      published_at: '2024-01-06T08:00:00Z',
      image: { id: 1, src: FEATURED },
      images: [{ id: 1, src: FEATURED }],
      variants: [
        {
          id: 11,
          sku: 'SKU-11',
          title: 'V11',
          price: '10.00',
          inventory_quantity: 3,
          inventory_item_id: 511,
          position: 11,
          option1: 'C11',
          option2: null,
          option3: null,
          image_id: null,
          requires_shipping: true,
          updated_at: '2026-09-01T00:00:00Z',
        },
      ],
    })
  })

  it('maps every ProductStatus explicitly and throws on an unknown one', () => {
    const cases = { ACTIVE: 'active', ARCHIVED: 'archived', DRAFT: 'draft', UNLISTED: 'unlisted' }
    for (const [gql, rest] of Object.entries(cases)) {
      expect(toRawProduct(product({ status: gql })).status).toBe(rest)
    }
    expect(() => toRawProduct(product({ status: 'HIDDEN' }))).toThrow('unknown product status')
    expect(() => toRawProduct(product({ status: 'active' }))).toThrow('unknown product status')
  })

  it('takes option1..3 from selectedOptions in order', () => {
    const v = variant(1, {
      selectedOptions: [
        { name: 'Color', value: 'Grey' },
        { name: 'Size', value: '42' },
        { name: 'Material', value: 'Wool' },
      ],
    })
    const [raw] = toRawProduct(product({ variants: page([v]) })).variants!
    expect([raw!.option1, raw!.option2, raw!.option3]).toEqual(['Grey', '42', 'Wool'])
  })

  it('nulls missing fields and rejects an unsafe legacyResourceId', () => {
    const raw = toRawProduct(
      product({
        title: null,
        descriptionHtml: null,
        tags: null,
        publishedAt: null,
        featuredMedia: null,
        variants: page([
          variant(1, {
            sku: null,
            inventoryQuantity: null,
            selectedOptions: null,
            inventoryItem: null,
            media: null,
          }),
        ]),
      })
    )
    expect(raw).toMatchObject({
      title: null,
      body_html: null,
      tags: '',
      published_at: null,
      image: null,
      images: [],
    })
    expect(raw.variants![0]).toMatchObject({
      sku: null,
      inventory_quantity: null,
      inventory_item_id: null,
      option1: null,
      image_id: null,
      requires_shipping: null,
    })
    expect(() => toRawProduct(product({ legacyResourceId: '9007199254740993' }))).toThrow()
    expect(() =>
      toRawProduct(product({ variants: page([variant(1, { legacyResourceId: 'x' })]) }))
    ).toThrow()
  })

  it('reads cost per item from the inventory item, keyed by its legacy id', () => {
    const costs = inventoryItemCosts(
      product({
        variants: page([
          variant(1),
          variant(2, {
            inventoryItem: { legacyResourceId: '777', requiresShipping: false, unitCost: null },
          }),
          variant(3, { inventoryItem: null }),
        ]),
      })
    )
    expect([...costs]).toEqual([
      ['501', '2.50'],
      ['777', null],
    ])
  })
})

describe('shopifySync product stream', () => {
  it('crawls by ID with no search filter and projects images, options and cost', async () => {
    const calls = stubGraphql([
      productsBody(
        [
          product({
            variants: page([
              variant(11, { media: { nodes: [{ image: { url: FEATURED } }] } }),
              variant(12, { media: { nodes: [{ image: { url: BLUE } }] } }),
              variant(13, {
                inventoryItem: {
                  legacyResourceId: '513',
                  requiresShipping: false,
                  unitCost: { amount: '12.345' },
                },
              }),
            ]),
          }),
        ],
        'p1'
      ),
    ])
    const result = await crawl()

    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe('https://test-shop.myshopify.com/admin/api/2026-07/graphql.json')
    expect(calls[0]!.body.query).toContain('sortKey: ID')
    expect(calls[0]!.body.query).not.toMatch(/status:/)
    expect(calls[0]!.body.variables).toEqual({ first: 50, after: null, query: null })

    const record = result.records[0]!
    expect(record.externalId).toBe('987654321')
    const fields = record.fields as Record<string, unknown>
    expect(fields).toMatchObject({
      status: 'active',
      tags: 'gift, summer',
      bodyHtml: '<p>Soft</p>',
      imageUrl: FEATURED,
    })
    const variants = fields.variants as Array<Record<string, unknown>>
    expect(variants.map((v) => v.imageUrl)).toEqual([FEATURED, BLUE, FEATURED])
    expect(variants.map((v) => v.shopifyId)).toEqual(['11', '12', '13'])
    expect(variants.map((v) => v.inventoryItemId)).toEqual(['511', '512', '513'])
    expect(variants.map((v) => v.unitCost)).toEqual([250, 250, 1235])
    expect(variants.map((v) => v.partKind)).toEqual(['finished_good', 'finished_good', 'service'])
    expect(variants.map((v) => v.option1)).toEqual(['C11', 'C12', 'C13'])
    expect(result.cursor).toEqual({ v: 3, after: 'p1' })
  })

  it('crawls unbounded on an empty query and returns no since on the last page', async () => {
    const calls = stubGraphql([productsBody([product()])])
    const result = await crawl()
    expect(calls[0]!.body.variables).toEqual({ first: 50, after: null, query: null })
    expect(result.cursor).toBeUndefined()
    expect(result.since).toBeUndefined()
  })

  it('refreshes products by id', async () => {
    const calls = stubGraphql([productsBody([product()])])
    await crawl(undefined, { ids: ['987654321'] })
    expect(calls[0]!.body.variables).toEqual({ first: 50, after: null, query: '(id:987654321)' })
  })

  it('restarts the crawl from scratch on a legacy REST cursor', async () => {
    const calls = stubGraphql([productsBody([product()], 'p1')])
    await crawl('eyJsYXN0X2lkIjo0fQ')
    expect(calls[0]!.body.variables).toEqual({ first: 50, after: null, query: null })
  })

  it('passes a v3 cursor as after', async () => {
    const calls = stubGraphql([productsBody([product()])])
    await crawl({ v: 3, after: 'p1' })
    expect(calls[0]!.body.variables).toEqual({ first: 50, after: 'p1', query: null })
  })

  it('pages variants beyond the first 100 before projecting', async () => {
    const first = Array.from({ length: 100 }, (_, i) => variant(i + 1))
    const calls = stubGraphql([
      productsBody([product({ variants: page(first, 'v1') }), product({ legacyResourceId: '2' })]),
      variantsBody([variant(101), variant(102)], 'v2'),
      variantsBody([variant(103)]),
    ])
    const result = await crawl()

    expect(calls).toHaveLength(3)
    expect(calls[1]!.body.query).toContain('product(id: $id)')
    expect(calls[1]!.body.variables).toEqual({ id: 'gid://shopify/Product/987654321', after: 'v1' })
    expect(calls[2]!.body.variables).toEqual({ id: 'gid://shopify/Product/987654321', after: 'v2' })
    const variants = (result.records[0]!.fields as Record<string, unknown>).variants as unknown[]
    expect(variants).toHaveLength(103)
    expect(result.records.map((r) => r.externalId)).toEqual(['987654321', '2'])
  })

  it('retries the whole page from the same cursor when a variant follow-up is throttled', async () => {
    stubGraphql([
      productsBody([product({ variants: page([variant(1)], 'v1') })], 'p2'),
      variantsBody([variant(2)], 'v2'),
      throttled,
    ])

    const result = await crawl({ v: 3, after: 'p1' })
    expect(result.records).toEqual([])
    expect(result.rateLimited).toEqual({ retryAfterMs: 2000 })
    expect(result.cursor).toBeUndefined()
  })

  it('drops a product deleted between the page and its variant follow-up', async () => {
    stubGraphql([
      productsBody([product({ variants: page([variant(1)], 'v1') })]),
      { body: { data: { product: null } } },
    ])
    const result = await crawl()
    expect(result.records).toEqual([])
    expect(result.cursor).toBeUndefined()
  })

  it('throws on an unknown product status instead of skipping it', async () => {
    stubGraphql([productsBody([product({ status: 'SOMETHING_NEW' })])])
    await expect(crawl()).rejects.toThrow('unknown product status')
  })
})

describe('shopifySync steered product fetch', () => {
  function steer(resourceId = '55555') {
    return shopifySync({
      streamKey: 'product',
      query: { ids: [resourceId], idKind: 'inventoryItem' },
      config: {},
      connection,
    })
  }

  it('refuses an id kind it does not know', async () => {
    await expect(
      shopifySync({
        streamKey: 'product',
        query: { ids: ['1'], idKind: 'variant' },
        config: {},
        connection,
      })
    ).rejects.toThrow(/kind "variant"/)
  })

  it('fetches the owning product in one query with the crawl selection', async () => {
    const calls = stubGraphql([
      {
        body: {
          data: {
            inventoryItem: {
              variant: {
                product: product({
                  variants: page([
                    variant(1),
                    variant(2, { media: { nodes: [{ image: { url: BLUE } }] } }),
                  ]),
                }),
              },
            },
          },
        },
      },
    ])
    const result = await steer()

    expect(calls).toHaveLength(1)
    expect(calls[0]!.body.query).toContain('inventoryItem(id: $id)')
    expect(calls[0]!.body.query).toContain('...ProductFields')
    expect(calls[0]!.body.variables).toEqual({ id: 'gid://shopify/InventoryItem/55555' })
    expect(result.cursor).toBeUndefined()
    const fields = result.records[0]!.fields as Record<string, unknown>
    expect(fields.imageUrl).toBe(FEATURED)
    const variants = fields.variants as Array<Record<string, unknown>>
    expect(variants.map((v) => v.imageUrl)).toEqual([FEATURED, BLUE])
    expect(variants.map((v) => v.unitCost)).toEqual([250, 250])
  })

  it('returns no records when the inventory item no longer resolves to a product', async () => {
    stubGraphql([{ body: { data: { inventoryItem: null } } }])
    expect(await steer()).toEqual({ records: [] })
  })

  it('surfaces a throttle as rateLimited', async () => {
    stubGraphql([throttled])
    const result = await steer()
    expect(result.records).toEqual([])
    expect(result.rateLimited).toEqual({ retryAfterMs: 2000 })
  })
})
