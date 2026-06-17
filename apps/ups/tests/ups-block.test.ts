// tests/ups-block.test.ts

import { describe, expect, it, vi } from 'vitest'
import dispatch from '../src/blocks/ups/ups.server'
import { flattenShipment } from '../src/tools/shared/block-io'
import type { MappedShipment } from '../src/tools/shared/shipment-schema'

function ctx() {
  const runTool = vi.fn(async (_id: string, _input: unknown) => ({ ok: true }))
  return { runTool }
}

describe('ups block dispatcher', () => {
  it('routes each operation to its internal tool id, forwarding input', async () => {
    const c = ctx()
    await dispatch({ resource: 'shipment', operation: 'track', trackingNumber: '1Z1' }, c)
    expect(c.runTool).toHaveBeenCalledWith('ups_block_track', {
      resource: 'shipment',
      operation: 'track',
      trackingNumber: '1Z1',
    })

    await dispatch({ resource: 'shipment', operation: 'watch', trackingNumber: '1Z1' }, c)
    expect(c.runTool).toHaveBeenLastCalledWith('ups_block_watch', expect.any(Object))

    await dispatch({ resource: 'shipment', operation: 'unwatch', trackingNumber: '1Z1' }, c)
    expect(c.runTool).toHaveBeenLastCalledWith('ups_block_unwatch', expect.any(Object))
  })

  it('throws on an unknown resource or operation', async () => {
    const c = ctx()
    await expect(dispatch({ resource: 'nope', operation: 'track' }, c)).rejects.toThrow(
      'Unknown resource'
    )
    await expect(dispatch({ resource: 'shipment', operation: 'nope' }, c)).rejects.toThrow(
      'Invalid operation'
    )
    // UPS has no by-reference op (FedEx does).
    await expect(
      dispatch({ resource: 'shipment', operation: 'trackByReference' }, c)
    ).rejects.toThrow('Invalid operation')
  })

  it('throws when no runtime ctx.runTool is available', async () => {
    await expect(dispatch({ resource: 'shipment', operation: 'track' })).rejects.toThrow(
      'ctx.runTool'
    )
  })
})

describe('flattenShipment', () => {
  const shipment: MappedShipment = {
    trackingNumber: '1Z1',
    statusType: 'delivered',
    statusCode: 'FS',
    statusDescription: 'Delivered',
    estimatedDelivery: '2026-06-11',
    estimatedDeliveryWindow: null,
    deliveredAt: '2026-06-11T19:32:00Z',
    lastActivity: { date: '2026-06-11T19:32:00Z', location: 'SF, CA, US', description: 'Delivered' },
    service: 'UPS Ground',
    weight: '5 LBS',
    referenceNumbers: [],
    scanEvents: [],
    proofOfDelivery: null,
    signature: null,
  }

  it('flattens a found shipment, deriving boolean flags', () => {
    const flat = flattenShipment('1Z1', true, shipment)
    expect(flat).toMatchObject({
      found: true,
      trackingNumber: '1Z1',
      statusType: 'delivered',
      isDelivered: true,
      isException: false,
      deliveredAt: '2026-06-11T19:32:00Z',
      lastActivityLocation: 'SF, CA, US',
      weight: '5 LBS',
      proofOfDelivery: '',
      signature: '',
    })
  })

  it('collapses nulls to empty strings when not found', () => {
    const flat = flattenShipment('999', false, null)
    expect(flat).toMatchObject({
      found: false,
      trackingNumber: '999',
      statusType: 'unknown',
      estimatedDelivery: '',
      deliveredAt: '',
      lastActivityLocation: '',
      weight: '',
    })
  })
})
