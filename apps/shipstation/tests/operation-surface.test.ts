// tests/operation-surface.test.ts

/**
 * The block's operation surface, for EVERY resource.
 *
 * `shipment-schema.test.ts` pins the tool map for `shipment` only, which left a
 * hole the width of the other six resources: adding `label.cancelRefund` with no
 * entry in `shipstationToolMap` passed the whole suite and would have thrown
 * `No tool mapped for label.cancelRefund` at run time, on a node the panel
 * happily offered.
 *
 * These are deliberately resource-agnostic — they walk `OPERATIONS_ALL`, so a
 * seventh resource or a twenty-fifth operation is covered the day it is added
 * rather than the day someone remembers to extend a list.
 */

import { describe, expect, it } from 'vitest'
import { requiredCapabilities } from '../src/blocks/shipstation/resources/capabilities'
import {
  OPERATIONS_ALL,
  RESOURCES_ALL,
  VALID_OPERATIONS,
} from '../src/blocks/shipstation/resources/constants'
import { shipstationToolMap } from '../src/blocks/shipstation/shipstation-tool-map'

const PAIRS = RESOURCES_ALL.flatMap(({ value: resource }) =>
  (OPERATIONS_ALL[resource as keyof typeof OPERATIONS_ALL] ?? []).map((op) => ({
    resource,
    operation: op.value as string,
    key: `${resource}.${op.value}`,
  }))
)

// Operations that change something at ShipStation. Held here as data rather than
// imported from `capabilities.ts`, so this file disagrees with that one loudly
// instead of restating it.
const EXPECTED_WRITES = new Set([
  'shipment.create',
  'shipment.update',
  'shipment.cancel',
  'shipment.addTag',
  'shipment.removeTag',
  'shipment.addNote',
  'label.create',
  'label.void',
  'label.cancelRefund',
  'label.createReturn',
])

describe('every advertised operation is dispatchable', () => {
  it('has at least one pair to check', () => {
    expect(PAIRS.length).toBeGreaterThan(20)
  })

  it.each(PAIRS)('$key maps to a block-internal tool id', ({ key }) => {
    const map = shipstationToolMap as Record<string, string>
    expect(map[key]).toBeTruthy()
    expect(map[key]).toMatch(/^block_shipstation_/)
  })

  it.each(PAIRS)('$key is listed in VALID_OPERATIONS', ({ resource, operation }) => {
    expect(VALID_OPERATIONS[resource]).toContain(operation)
  })

  it('maps no tool for an operation nothing advertises', () => {
    const advertised = new Set(PAIRS.map((p) => p.key))
    for (const key of Object.keys(shipstationToolMap as Record<string, string>)) {
      expect(advertised.has(key)).toBe(true)
    }
  })
})

describe('every write operation is gated', () => {
  it.each(PAIRS)('$key requires a capability iff it writes', ({ resource, operation, key }) => {
    const required = requiredCapabilities(resource, operation)
    expect(required.length > 0).toBe(EXPECTED_WRITES.has(key))
  })

  it('never lets a purchase-gated operation through on `write` alone', () => {
    // `label.create` spends money and must need `purchase`; `label.void` and
    // `label.cancelRefund` must NOT, or an org could buy and be unable to undo.
    expect(requiredCapabilities('label', 'create')).toEqual(['purchase'])
    expect(requiredCapabilities('label', 'void')).toEqual(['write'])
    expect(requiredCapabilities('label', 'cancelRefund')).toEqual(['write'])
  })
})
