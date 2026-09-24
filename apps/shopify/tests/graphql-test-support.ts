// apps/shopify/tests/graphql-test-support.ts
//
// A scripted Admin GraphQL `fetch`: serves responses in order and records each request.

import { vi } from 'vitest'

export interface GraphqlCall {
  url: string
  body: { query: string; variables: Record<string, unknown> }
}

export interface ScriptedGraphql {
  status?: number
  body?: unknown
  headers?: Record<string, string>
}

export function stubGraphql(responses: ScriptedGraphql[]): GraphqlCall[] {
  const calls: GraphqlCall[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) })
    const next = responses[calls.length - 1]
    if (!next) throw new Error(`unexpected fetch #${calls.length}: ${url}`)
    return new Response(JSON.stringify(next.body ?? {}), {
      status: next.status ?? 200,
      headers: { 'Content-Type': 'application/json', ...next.headers },
    })
  })
  return calls
}

export const connection = {
  value: 'shpat_test',
  metadata: { connectionVariables: { shop: 'test-shop' } },
}
