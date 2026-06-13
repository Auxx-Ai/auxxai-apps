// tests/fedex-block.test.ts

import { describe, expect, it, vi } from 'vitest'
import dispatch from '../src/blocks/fedex/fedex.server'
import { flattenShipment } from '../src/tools/shared/block-io'
import type { MappedShipment } from '../src/tools/shared/shipment-schema'

function ctx() {
  const runTool = vi.fn(async (_id: string, _input: unknown) => ({ ok: true }))
  return { runTool }
}

describe('fedex block dispatcher', () => {
  it('routes each operation to its internal tool id, forwarding input', async () => {
    const c = ctx()
    await dispatch({ resource: 'shipment', operation: 'track', trackingNumber: '111' }, c)
    expect(c.runTool).toHaveBeenCalledWith('fedex_block_track', {
      resource: 'shipment',
      operation: 'track',
      trackingNumber: '111',
    })

    await dispatch({ resource: 'shipment', operation: 'trackByReference', reference: 'PO1' }, c)
    expect(c.runTool).toHaveBeenLastCalledWith('fedex_block_track_by_reference', {
      resource: 'shipment',
      operation: 'trackByReference',
      reference: 'PO1',
    })

    await dispatch({ resource: 'shipment', operation: 'watch', trackingNumber: '111' }, c)
    expect(c.runTool).toHaveBeenLastCalledWith('fedex_block_watch', expect.any(Object))

    await dispatch({ resource: 'shipment', operation: 'unwatch', trackingNumber: '111' }, c)
    expect(c.runTool).toHaveBeenLastCalledWith('fedex_block_unwatch', expect.any(Object))
  })

  it('throws on an unknown resource or operation', async () => {
    const c = ctx()
    await expect(dispatch({ resource: 'nope', operation: 'track' }, c)).rejects.toThrow(
      'Unknown resource'
    )
    await expect(dispatch({ resource: 'shipment', operation: 'nope' }, c)).rejects.toThrow(
      'Invalid operation'
    )
  })

  it('throws when no runtime ctx.runTool is available', async () => {
    await expect(dispatch({ resource: 'shipment', operation: 'track' })).rejects.toThrow(
      'ctx.runTool'
    )
  })
})

describe('flattenShipment', () => {
  const shipment: MappedShipment = {
    trackingNumber: '111',
    statusType: 'delivered',
    statusCode: 'DL',
    statusDescription: 'Delivered',
    estimatedDelivery: '2026-06-11T20:00:00Z',
    estimatedDeliveryWindow: null,
    deliveredAt: '2026-06-11T19:32:00Z',
    isDelayed: false,
    lastActivity: { date: '2026-06-11T19:32:00Z', location: 'SF, CA, US', description: 'Delivered' },
    service: 'FedEx Express',
    receivedByName: 'J.COOPER',
    scanEvents: [],
  }

  it('flattens a found shipment, deriving boolean flags', () => {
    const flat = flattenShipment('111', true, shipment, 1)
    expect(flat).toMatchObject({
      found: true,
      trackingNumber: '111',
      matchCount: 1,
      statusType: 'delivered',
      isDelivered: true,
      isException: false,
      deliveredAt: '2026-06-11T19:32:00Z',
      lastActivityLocation: 'SF, CA, US',
      receivedByName: 'J.COOPER',
    })
  })

  it('collapses nulls to empty strings when not found', () => {
    const flat = flattenShipment('999', false, null, 0)
    expect(flat).toMatchObject({
      found: false,
      trackingNumber: '999',
      matchCount: 0,
      statusType: 'unknown',
      estimatedDelivery: '',
      deliveredAt: '',
      lastActivityLocation: '',
    })
  })
})
