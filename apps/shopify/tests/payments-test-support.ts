// apps/shopify/tests/payments-test-support.ts
//
// Shared doubles for the Shopify Payments tool tests: a fake server SDK carrying one bound
// connection, and a scripted `fetch` that serves pages in order and records every URL hit.

import { vi } from 'vitest'

export const GRANTED_WITH_PAYOUTS =
  'read_orders,write_orders,read_products,read_shopify_payments_payouts'
export const GRANTED_WITHOUT_PAYOUTS = 'read_orders,write_orders,read_products'

export function stubConnection(scope: string | undefined): void {
  vi.stubGlobal('AUXX_SERVER_SDK', {
    getConnection: () => ({
      value: 'shpat_test',
      metadata: { connectionVariables: { shop: 'test-shop' }, ...(scope ? { scope } : {}) },
    }),
  })
}

export interface ScriptedPage {
  status?: number
  body?: unknown
  next?: string
  /** Simulate a network-level failure instead of a response. */
  reject?: Error
}

export interface ScriptedFetch {
  urls: string[]
  calls: number
}

export function stubFetch(pages: ScriptedPage[]): ScriptedFetch {
  const state: ScriptedFetch = { urls: [], calls: 0 }
  vi.stubGlobal('fetch', (url: string) => {
    state.urls.push(url)
    const page = pages[state.calls++]
    if (!page) return Promise.reject(new Error(`unexpected fetch #${state.calls}: ${url}`))
    if (page.reject) return Promise.reject(page.reject)
    const status = page.status ?? 200
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      headers: {
        get: (name: string) => {
          if (name === 'Link' && page.next) return `<${page.next}>; rel="next"`
          if (name === 'Retry-After' && status === 429) return '2'
          return null
        },
      },
      json: () => Promise.resolve(page.body ?? {}),
    })
  })
  return state
}
