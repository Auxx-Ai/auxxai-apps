// apps/shopify/tests/capabilities.test.ts

import { describe, expect, it, vi } from 'vitest'
import {
  deriveCapabilities,
  isOperationAllowed,
  requiredCapabilities,
} from '../src/blocks/shopify/resources/capabilities'
import { ASSUMED_SCOPES_WHEN_UNKNOWN } from '../src/blocks/shopify/resources/scope-grants'

/** The 10 scopes the platform app declares today (shopify.app.toml). */
const PLATFORM_SCOPES = ASSUMED_SCOPES_WHEN_UNKNOWN.join(' ')

/**
 * What `TEMP_RESTRICTIONS` used to hide. This is the regression guard for the whole
 * refactor: the platform's current scopes must derive exactly the old restricted surface.
 */
const PREVIOUSLY_RESTRICTED: Record<string, string[]> = {
  customer: ['create', 'update', 'delete'],
  customerAddress: ['create', 'update', 'delete', 'setDefault'],
  draftOrder: ['create', 'update', 'delete', 'complete', 'sendInvoice'],
  inventoryItem: ['update'],
  inventoryLevel: ['set', 'adjust', 'connect', 'delete'],
  fulfillment: ['create', 'update', 'cancel'],
}

describe('deriveCapabilities — the platform app’s current scopes', () => {
  it('reproduces the old TEMP_RESTRICTIONS surface exactly (this refactor is a no-op)', () => {
    const { operations, resources } = deriveCapabilities(PLATFORM_SCOPES)

    // `discount` had no granting scope at all, read or write.
    expect(resources).not.toContain('discount')
    expect(operations.discount).toBeUndefined()

    for (const [resource, hidden] of Object.entries(PREVIOUSLY_RESTRICTED)) {
      for (const op of hidden) {
        expect(operations[resource], `${resource}.${op} must stay hidden`).not.toContain(op)
      }
      // …and the reads for those resources must still be present.
      expect(operations[resource]).toContain('getMany')
    }
  })

  it('keeps every operation the granted scopes DO cover', () => {
    const { operations } = deriveCapabilities(PLATFORM_SCOPES)
    expect(operations.order).toEqual(
      expect.arrayContaining(['create', 'update', 'delete', 'get', 'getMany'])
    )
    expect(operations.product).toEqual(expect.arrayContaining(['create', 'update', 'delete']))
    // metafield is `owner-derived` — ungated by design, as it was before.
    expect(operations.metafield).toEqual(
      expect.arrayContaining(['create', 'update', 'delete', 'get', 'getMany'])
    )
  })
})

describe('deriveCapabilities — adding scopes unlocks exactly what they grant', () => {
  it('write_customers surfaces the customer + customerAddress writes and nothing else', () => {
    const before = deriveCapabilities(PLATFORM_SCOPES)
    const after = deriveCapabilities(`${PLATFORM_SCOPES} write_customers`)

    expect(after.operations.customer).toEqual(
      expect.arrayContaining(['create', 'update', 'delete'])
    )
    expect(after.operations.customerAddress).toEqual(
      expect.arrayContaining(['create', 'update', 'delete', 'setDefault'])
    )
    // Untouched elsewhere.
    expect(after.operations.draftOrder).toEqual(before.operations.draftOrder)
    expect(after.operations.inventoryLevel).toEqual(before.operations.inventoryLevel)
    expect(after.resources).not.toContain('discount')
  })

  it('price-rule scopes bring the discount resource back', () => {
    const { resources, operations } = deriveCapabilities(
      `${PLATFORM_SCOPES} read_price_rules write_price_rules`
    )
    expect(resources).toContain('discount')
    expect(operations.discount).toEqual(
      expect.arrayContaining(['create', 'update', 'delete', 'get', 'getMany'])
    )
  })

  it('a write scope alone satisfies a read requirement — no implication rule needed', () => {
    const { operations } = deriveCapabilities('write_orders')
    expect(operations.order).toEqual(
      expect.arrayContaining(['get', 'getMany', 'create', 'update', 'delete'])
    )
  })

  it('either fulfillment scope family satisfies fulfillment reads', () => {
    for (const scope of [
      'read_merchant_managed_fulfillment_orders',
      'read_assigned_fulfillment_orders',
    ]) {
      expect(deriveCapabilities(scope).operations.fulfillment).toContain('getMany')
    }
  })

  it('read_all_orders grants a capability that is not an operation gate', () => {
    const { capabilities } = deriveCapabilities(`${PLATFORM_SCOPES} read_all_orders`)
    expect(capabilities.has('orders:history-full')).toBe(true)
  })
})

describe('deriveCapabilities — fallbacks', () => {
  it('an absent granted scope assumes the definition’s list', () => {
    // Rows minted outside the OAuth callback (persist-shopify-token.ts) must behave exactly
    // as they did before this mechanism existed.
    for (const absent of [undefined, null, '', '   ']) {
      expect(deriveCapabilities(absent)).toEqual(deriveCapabilities(PLATFORM_SCOPES))
    }
  })

  it('reports an unrecognised scope rather than silently dropping operations', () => {
    const onUnknownScope = vi.fn()
    deriveCapabilities('read_orders read_something_new', onUnknownScope)
    expect(onUnknownScope).toHaveBeenCalledExactlyOnceWith('read_something_new')
  })

  it('an empty grant yields no operations at all', () => {
    // Not reachable via deriveCapabilities (empty falls back), but the guard must hold.
    expect(isOperationAllowed(new Set(), 'order', 'getMany')).toBe(false)
  })
})

describe('requiredCapabilities', () => {
  it('splits read from write by operation verb', () => {
    expect(requiredCapabilities('order', 'getMany')).toEqual(['orders:read'])
    expect(requiredCapabilities('order', 'create')).toEqual(['orders:write'])
  })

  it('leaves owner-derived and unknown resources ungated', () => {
    expect(requiredCapabilities('metafield', 'create')).toEqual([])
    expect(requiredCapabilities('notARealResource', 'create')).toEqual([])
  })
})
