// tests/__mocks__/auxx-sdk-server.ts

/**
 * Mock of `@auxx/sdk/server` for vitest. Provides the SDK error classes, an
 * in-memory `storage` implementation (scope + collection + TTL aware), and
 * controllable `getConnection` / `getOrganizationSetting`.
 */

import { vi } from 'vitest'

// --- Error classes -------------------------------------------------------

export class ConnectionExpiredError extends Error {
  constructor(public scope: 'user' | 'organization' = 'organization') {
    super(`${scope} connection expired`)
    this.name = 'ConnectionExpiredError'
  }
}
export class InsufficientPermissionsError extends Error {
  constructor(public scope: 'user' | 'organization' = 'organization') {
    super('insufficient permissions')
    this.name = 'InsufficientPermissionsError'
  }
}
export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidInputError'
  }
}
export class NotFoundError extends Error {
  constructor(message = 'not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}
export class ConflictError extends Error {
  constructor(message = 'conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}
export class RateLimitError extends Error {
  constructor(public retryAfterSeconds?: number) {
    super('rate limited')
    this.name = 'RateLimitError'
  }
}
export class UpstreamServiceError extends Error {
  constructor(
    message = 'upstream unavailable',
    public statusCode?: number
  ) {
    super(message)
    this.name = 'UpstreamServiceError'
  }
}

// --- In-memory storage ---------------------------------------------------

interface Row {
  value: unknown
  expiresAt: number | null
}
const store = new Map<string, Row>()
const composeKey = (scope: string, collection: string, key: string) =>
  `${scope}::${collection}::${key}`

function live(row: Row | undefined): Row | undefined {
  if (!row) return undefined
  if (row.expiresAt !== null && row.expiresAt <= Date.now()) return undefined
  return row
}

/**
 * Resolve a scope to its effective namespace. `connection` scope folds in the
 * current connection id so two connections never share a namespace — mirroring
 * the host, which resolves the ambient connection.
 */
function effScope(scope?: string): string {
  if (scope === 'connection') {
    const id = (connection as { id?: string } | null)?.id ?? 'none'
    return `connection:${id}`
  }
  return scope ?? 'installation'
}

function itemApi(collection: string, defaults: { scope?: string; ttlSeconds?: number }) {
  const scopeOf = (opts?: { scope?: string }) => effScope(opts?.scope ?? defaults.scope)
  const ttlOf = (opts?: { ttlSeconds?: number }) => opts?.ttlSeconds ?? defaults.ttlSeconds
  return {
    async get(key: string, opts?: { scope?: string }) {
      const row = live(store.get(composeKey(scopeOf(opts), collection, key)))
      return row ? { value: row.value } : null
    },
    async set(key: string, value: unknown, opts?: { scope?: string; ttlSeconds?: number }) {
      const ttl = ttlOf(opts)
      store.set(composeKey(scopeOf(opts), collection, key), {
        value,
        expiresAt: ttl ? Date.now() + ttl * 1000 : null,
      })
    },
    async setIfAbsent(key: string, value: unknown, opts?: { scope?: string; ttlSeconds?: number }) {
      const composed = composeKey(scopeOf(opts), collection, key)
      if (live(store.get(composed))) return false
      const ttl = ttlOf(opts)
      store.set(composed, { value, expiresAt: ttl ? Date.now() + ttl * 1000 : null })
      return true
    },
    async remove(key: string, opts?: { scope?: string }) {
      store.delete(composeKey(scopeOf(opts), collection, key))
    },
  }
}

export const storage = {
  ...itemApi('', {}),
  collection(name: string, defaults: { scope?: string; ttlSeconds?: number } = {}) {
    return {
      ...itemApi(name, defaults),
      async list() {
        // Resolve lazily so the current connection is reflected.
        const prefix = `${effScope(defaults.scope)}::${name}::`
        const entries: Array<{ key: string; value: unknown }> = []
        for (const [composed, row] of store) {
          if (composed.startsWith(prefix) && live(row)) {
            entries.push({ key: composed.slice(prefix.length), value: row.value })
          }
        }
        return { entries }
      },
    }
  },
}

/** Test helper — wipe all storage between tests. */
export const __resetStorage = () => store.clear()
/** Test helper — inspect a raw stored row (scope resolved like the host). */
export const __peek = (scope: string, collection: string, key: string) =>
  store.get(composeKey(effScope(scope), collection, key))

// --- Connection ----------------------------------------------------------

let connection: unknown = {
  id: 'conn-1',
  type: 'secret',
  value: '',
  fields: { client_id: 'cid', client_secret: 'csec', account_number: '123456789' },
}
export const __setConnection = (c: unknown) => {
  connection = c
}
export const getConnection = vi.fn(() => connection)
export const getOrganizationConnection = vi.fn(() => connection)

// --- Settings ------------------------------------------------------------

let settings: Record<string, unknown> = {}
export const __setSetting = (key: string, value: unknown) => {
  settings[key] = value
}
export const __resetSettings = () => {
  settings = {}
}
export const getOrganizationSetting = vi.fn(async (key: string) => settings[key])
