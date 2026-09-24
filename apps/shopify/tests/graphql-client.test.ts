// apps/shopify/tests/graphql-client.test.ts

import { ConnectionExpiredError, InsufficientPermissionsError } from '@auxx/sdk/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ADMIN_API_VERSION, shopifyGraphql, type ShopifyHttp } from '../src/graphql/client'
import { stubGraphql } from './graphql-test-support'

const http: ShopifyHttp = { shopDomain: 'test-shop.myshopify.com', headers: { a: 'b' } }
const run = () => shopifyGraphql<{ shop: { id: string } }>(http, 'query { shop { id } }', { x: 1 })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('shopifyGraphql', () => {
  it('posts query + variables to the pinned version and returns data', async () => {
    const calls = stubGraphql([{ body: { data: { shop: { id: 'gid://shopify/Shop/1' } } } }])
    await expect(run()).resolves.toEqual({
      ok: true,
      data: { shop: { id: 'gid://shopify/Shop/1' } },
    })
    expect(calls[0]!.url).toBe(
      `https://test-shop.myshopify.com/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    )
    expect(calls[0]!.body).toEqual({ query: 'query { shop { id } }', variables: { x: 1 } })
  })

  it('maps HTTP 429 to a throttle carrying Retry-After', async () => {
    stubGraphql([{ status: 429, headers: { 'Retry-After': '2' } }])
    await expect(run()).resolves.toEqual({ ok: false, retryAfterMs: 2000 })
  })

  it('maps THROTTLED to a wait computed from the cost block', async () => {
    stubGraphql([
      {
        body: {
          errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }],
          extensions: {
            cost: {
              requestedQueryCost: 662,
              throttleStatus: { maximumAvailable: 2000, currentlyAvailable: 12, restoreRate: 100 },
            },
          },
        },
      },
    ])
    // (662 - 12) / 100 s = 6.5 s
    await expect(run()).resolves.toEqual({ ok: false, retryAfterMs: 6500 })
  })

  it('leaves the wait undefined when THROTTLED has no usable cost', async () => {
    stubGraphql([
      { body: { errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }] } },
    ])
    await expect(run()).resolves.toEqual({ ok: false, retryAfterMs: undefined })
  })

  it('maps ACCESS_DENIED to InsufficientPermissionsError', async () => {
    stubGraphql([
      {
        body: {
          data: { shop: null },
          errors: [{ message: 'Access denied', extensions: { code: 'ACCESS_DENIED' } }],
        },
      },
    ])
    await expect(run()).rejects.toBeInstanceOf(InsufficientPermissionsError)
  })

  it('treats data + errors as a failure, never a partial success', async () => {
    stubGraphql([
      {
        body: {
          data: { shop: { id: 'gid://shopify/Shop/1' } },
          errors: [{ message: 'boom' }, { message: 'bang' }],
        },
      },
    ])
    await expect(run()).rejects.toThrow('boom; bang')
  })

  it('throws on a search warning (an ignored filter would widen the crawl)', async () => {
    stubGraphql([
      {
        body: {
          data: { shop: { id: 'gid://shopify/Shop/1' } },
          extensions: {
            search: [
              {
                path: ['customers'],
                query: 'payout_id:1',
                warnings: [{ field: 'payout_id', message: 'Invalid search field for this query.' }],
              },
            ],
          },
        },
      },
    ])
    await expect(run()).rejects.toThrow('payout_id: Invalid search field')
  })

  it('accepts an empty search warning list', async () => {
    stubGraphql([
      {
        body: {
          data: { shop: { id: 'gid://shopify/Shop/1' } },
          extensions: { search: [{ path: ['customers'], warnings: [] }] },
        },
      },
    ])
    await expect(run()).resolves.toMatchObject({ ok: true })
  })

  it('maps 401 and 403 to the SDK errors, other statuses throw', async () => {
    stubGraphql([{ status: 401 }, { status: 403 }, { status: 500 }])
    await expect(run()).rejects.toBeInstanceOf(ConnectionExpiredError)
    await expect(run()).rejects.toBeInstanceOf(InsufficientPermissionsError)
    await expect(run()).rejects.toThrow('responded 500')
  })

  it('warns once when Shopify serves a different version', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const served = { 'X-Shopify-API-Version': '2025-01' }
    const ok = { body: { data: { shop: { id: 'x' } } }, headers: served }
    stubGraphql([ok, ok])
    await run()
    await run()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('2025-01')
  })
})
