// tests/shipment-schema.test.ts

/**
 * The `shipment` resource's schema contract with the rest of the block.
 *
 * Seven resources merge into ONE flat `inputs` namespace, so the only thing
 * keeping them from colliding is the `<resource><Operation><Field>` convention.
 * That is a naming rule with no compiler behind it, which is exactly the kind of
 * rule that needs a test.
 */

import { describe, expect, it } from 'vitest'
import { OPERATIONS_ALL } from '../src/blocks/shipstation/resources/constants'
import {
  shipmentComputeOutputs,
  shipmentInputs,
} from '../src/blocks/shipstation/resources/shipment/shipment-schema'
import { shipstationToolMap } from '../src/blocks/shipstation/shipstation-tool-map'

const SHIPMENT_OPERATIONS = OPERATIONS_ALL.shipment.map((op) => op.value)

describe('the input namespace', () => {
  it('prefixes every key with the resource', () => {
    for (const key of Object.keys(shipmentInputs)) {
      expect(key.startsWith('shipment')).toBe(true)
    }
  })

  it('names the operation after the resource, so no key is a bare field name', () => {
    // `shipmentGetId`, never `getId`: six other resources have a `get`.
    const operationSegments = SHIPMENT_OPERATIONS.map(
      (op) => op.charAt(0).toUpperCase() + op.slice(1)
    )
    for (const key of Object.keys(shipmentInputs)) {
      const rest = key.slice('shipment'.length)
      expect(operationSegments.some((segment) => rest.startsWith(segment))).toBe(true)
    }
  })

  it('covers all eight operations', () => {
    const keys = Object.keys(shipmentInputs)
    for (const op of SHIPMENT_OPERATIONS) {
      const segment = op.charAt(0).toUpperCase() + op.slice(1)
      expect(keys.some((key) => key.startsWith(`shipment${segment}`))).toBe(true)
    }
  })

  it('declares the ship-to address as an address field, not a text box', () => {
    expect(shipmentInputs.shipmentCreateShipTo.toJSON().type).toBe('address')
    expect(shipmentInputs.shipmentUpdateShipTo.toJSON().type).toBe('address')
    expect(shipmentInputs.shipmentCreateShipFrom.toJSON().type).toBe('address')
  })

  it('declares packages as an array so multi-box shipments are expressible', () => {
    expect(shipmentInputs.shipmentCreatePackages.toJSON().type).toBe('array')
    expect(shipmentInputs.shipmentUpdatePackages.toJSON().type).toBe('array')
  })

  it('marks the identifiers required', () => {
    const required = [
      'shipmentGetId',
      'shipmentUpdateShipmentId',
      'shipmentCancelShipmentId',
      'shipmentAddTagShipmentId',
      'shipmentAddTagName',
      'shipmentRemoveTagShipmentId',
      'shipmentRemoveTagName',
      'shipmentAddNoteShipmentId',
    ] as const

    for (const key of required) {
      expect(shipmentInputs[key].toJSON()._metadata?.required).toBe(true)
    }
  })
})

describe('computeOutputs', () => {
  it('produces variables for every operation the resource advertises', () => {
    for (const op of SHIPMENT_OPERATIONS) {
      expect(Object.keys(shipmentComputeOutputs(op)).length).toBeGreaterThan(0)
    }
  })

  it('gives a single shipment to the operations that return one', () => {
    for (const op of ['get', 'create', 'update']) {
      expect(Object.keys(shipmentComputeOutputs(op))).toEqual(['shipment'])
    }
  })

  it('gives a list plus its paging counters to getMany', () => {
    expect(Object.keys(shipmentComputeOutputs('getMany'))).toEqual([
      'shipments',
      'count',
      'total',
      'page',
      'pages',
    ])
  })

  it('returns nothing for an operation belonging to another resource', () => {
    expect(shipmentComputeOutputs('validate')).toEqual({})
  })
})

describe('the tool map', () => {
  it('maps every shipment operation to a block-internal tool id', () => {
    const map = shipstationToolMap as Record<string, string>
    for (const op of SHIPMENT_OPERATIONS) {
      expect(map[`shipment.${op}`]).toMatch(/^block_shipstation_shipment_/)
    }
  })
})
