// tests/authorize-net-manifest.test.ts
//
// `src/app.tsx` is read as text rather than imported: `@auxx/sdk/client` is a
// types-only export with no runtime entry.

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { authorizeNetConnector } from '../src/authorize-net.connector'
import { authorizeNetToolMap } from '../src/blocks/authorize-net/authorize-net-tool-map'
import { authorizeNetToolsets } from '../src/tools/toolsets'

const TOOL_IDS = [
  'list_authorize_net_batches',
  'list_authorize_net_batch_transactions',
  'get_authorize_net_transaction',
  'list_authorize_net_unsettled',
]

const src = new URL('../src/', import.meta.url)
const appSource = readFileSync(new URL('app.tsx', src), 'utf8')

describe('the tools', () => {
  it.each(TOOL_IDS)('%s exists and declares its own id', (id) => {
    const file = new URL(`tools/${id}.tool.tsx`, src)
    expect(existsSync(file)).toBe(true)
    const source = readFileSync(file, 'utf8')
    expect(source).toContain(`id: '${id}',`)
    expect(source).toMatch(/READ-ONLY/)
    expect(source).toMatch(/monthly statement/)
  })

  it('registers exactly those four in app.tsx, and nothing else', () => {
    const registered = [...appSource.matchAll(/\n {4}(\w+Tool),/g)].map((m) => m[1])
    expect(registered).toHaveLength(4)
    expect(registered).toEqual([
      'listAuthorizeNetBatchesTool',
      'listAuthorizeNetBatchTransactionsTool',
      'getAuthorizeNetTransactionTool',
      'listAuthorizeNetUnsettledTool',
    ])
  })

  it('has no write tool on disk at all', () => {
    // Build plan §7 keeps writes out until refund ownership is decided.
    for (const id of TOOL_IDS) {
      expect(id).not.toMatch(/capture|refund|void|create|update|delete|cancel/i)
    }
    for (const name of ['capture', 'refund', 'void', 'create', 'update']) {
      expect(existsSync(new URL(`tools/${name}_authorize_net_transaction.tool.tsx`, src))).toBe(
        false
      )
    }
  })
})

describe('the toolset', () => {
  it('is one staff read grant, holding exactly the four tools', () => {
    expect(authorizeNetToolsets).toHaveLength(1)
    expect(authorizeNetToolsets[0]!.id).toBe('authorize_net.settlements')
    expect(authorizeNetToolsets[0]!.tools).toEqual(TOOL_IDS)
    expect(authorizeNetToolsets[0]!.description).toMatch(/READ-ONLY/)
    expect(authorizeNetToolsets[0]!.description).toMatch(/STAFF ONLY/)
  })

  it('declares no write toolset', () => {
    expect(authorizeNetToolsets.some((toolset) => /write/i.test(toolset.id))).toBe(false)
  })

  it('every tool names this toolset and stays off the customer-facing surfaces', () => {
    for (const id of TOOL_IDS) {
      const source = readFileSync(new URL(`tools/${id}.tool.tsx`, src), 'utf8')
      expect(source).toContain("toolsetSlug: 'authorize_net.settlements'")
      expect(source).toContain("surfaces: ['internal', 'builder']")
    }
  })
})

describe('the connector', () => {
  it('is the only one the app registers', () => {
    expect(appSource).toContain('dataConnectors: [authorizeNetConnector]')
    expect(authorizeNetConnector.streams.length).toBeGreaterThanOrEqual(1)
  })

  it('declares NO entities and NO app fields of its own', () => {
    // An unused `defineEntity` still provisions a definition on install, so the
    // scaffold files are asserted gone rather than merely unreferenced.
    expect(existsSync(new URL('entities.ts', src))).toBe(false)
    expect(existsSync(new URL('fields.ts', src))).toBe(false)
    for (const stream of authorizeNetConnector.streams) {
      for (const mapping of stream.mappings) {
        expect(mapping.target).toHaveProperty('entityKind')
        expect(mapping.target).not.toHaveProperty('entityKey')
      }
    }
  })
})

describe('the workflow block', () => {
  it('is registered, and dispatches only to the four read tools', () => {
    expect(appSource).toContain('workflow: { blocks: [authorizeNetBlock] }')
    expect(Object.values(authorizeNetToolMap).sort()).toEqual([...TOOL_IDS].sort())
  })
})
