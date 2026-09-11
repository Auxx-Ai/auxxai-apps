// tests/roll-up.test.ts

/**
 * The `ShipmentStatus` roll-up and the provider-status normalization.
 *
 * These are the two pure functions the connector server exists for: a mapping
 * field is a `sourcePath` to `target` binding with no transform hook, so the
 * normalized value has to be emitted already-shaped. Everything asserted here is
 * the rule from `shared-shipment-entities-proposal.md` §6 and §8d.
 */

import { describe, expect, it } from 'vitest'
import {
  type RollUpParcel,
  normalizeProviderShipmentStatus,
  rollUpShipmentStatus,
} from '../src/shipstation.connector.server'

const active = (status: RollUpParcel['status']): RollUpParcel => ({ voided: false, status })
const voided = (status: RollUpParcel['status']): RollUpParcel => ({ voided: true, status })

describe('rollUpShipmentStatus', () => {
  it('is delivered only when every active parcel is delivered', () => {
    expect(rollUpShipmentStatus([active('delivered')])).toBe('delivered')
    expect(
      rollUpShipmentStatus([active('delivered'), active('delivered'), active('delivered')])
    ).toBe('delivered')
  })

  it('is partially_delivered for any mix of delivered and not-delivered', () => {
    expect(rollUpShipmentStatus([active('delivered'), active('in_transit')])).toBe(
      'partially_delivered'
    )
    expect(
      rollUpShipmentStatus([active('delivered'), active('delivered'), active('out_for_delivery')])
    ).toBe('partially_delivered')
    // A delivered box beside an unknown one is still only partially delivered.
    expect(rollUpShipmentStatus([active('delivered'), active('unknown')])).toBe(
      'partially_delivered'
    )
  })

  it('takes the attention-needing status when one box among three is in exception', () => {
    // The reason the precedence is attention-first: this shipment must read
    // `exception` on a ticket, not `in_transit`, or the bad box stays invisible.
    expect(
      rollUpShipmentStatus([active('in_transit'), active('exception'), active('in_transit')])
    ).toBe('exception')
  })

  it('lets exception outrank even a partially delivered shipment', () => {
    expect(
      rollUpShipmentStatus([active('delivered'), active('exception'), active('in_transit')])
    ).toBe('exception')
  })

  it('orders the rest of the precedence attention-first', () => {
    expect(
      rollUpShipmentStatus([active('returned_to_shipper'), active('attempted_delivery')])
    ).toBe('returned_to_shipper')
    expect(rollUpShipmentStatus([active('attempted_delivery'), active('delayed')])).toBe(
      'attempted_delivery'
    )
    expect(rollUpShipmentStatus([active('delayed'), active('out_for_delivery')])).toBe('delayed')
    expect(rollUpShipmentStatus([active('ready_for_pickup'), active('in_transit')])).toBe(
      'ready_for_pickup'
    )
    expect(rollUpShipmentStatus([active('out_for_delivery'), active('in_transit')])).toBe(
      'out_for_delivery'
    )
    expect(rollUpShipmentStatus([active('in_transit'), active('picked_up')])).toBe('in_transit')
    expect(rollUpShipmentStatus([active('picked_up'), active('label_created')])).toBe('picked_up')
  })

  it('never lets unknown outrank a box we know something about', () => {
    expect(rollUpShipmentStatus([active('unknown'), active('in_transit')])).toBe('in_transit')
    expect(rollUpShipmentStatus([active('unknown'), active('label_created')])).toBe('label_created')
  })

  it('treats a null parcel status as unknown', () => {
    expect(rollUpShipmentStatus([active(null)])).toBe('unknown')
    expect(rollUpShipmentStatus([active(null), active('in_transit')])).toBe('in_transit')
  })

  it('excludes voided parcels entirely', () => {
    // The voided box is in exception; the shipment is not, because a voided box
    // says nothing about where the shipment is.
    expect(rollUpShipmentStatus([voided('exception'), active('in_transit')])).toBe('in_transit')
    // All three delivered among the active ones, despite a voided straggler.
    expect(rollUpShipmentStatus([voided('label_created'), active('delivered')])).toBe('delivered')
  })

  it('is unknown when every parcel is voided', () => {
    expect(rollUpShipmentStatus([voided('delivered'), voided('in_transit')])).toBe('unknown')
  })

  it('is unknown when there are no parcels at all', () => {
    expect(rollUpShipmentStatus([])).toBe('unknown')
  })
})

describe('normalizeProviderShipmentStatus', () => {
  it('maps the one value the live probe observed', () => {
    // `label_purchased` is a label-lifecycle value, not a transit one.
    expect(normalizeProviderShipmentStatus('label_purchased')).toBe('label_created')
  })

  it('maps an unrecognized provider value to unknown, never to a guess', () => {
    // Each of these is a plausible-looking string that the probe never saw. A
    // value list copied out of vendor documentation is exactly what build plan
    // §2 forbids, so none of them may be interpreted.
    expect(normalizeProviderShipmentStatus('in_transit')).toBe('unknown')
    expect(normalizeProviderShipmentStatus('delivered')).toBe('unknown')
    expect(normalizeProviderShipmentStatus('pending')).toBe('unknown')
    expect(normalizeProviderShipmentStatus('LABEL_PURCHASED')).toBe('unknown')
    expect(normalizeProviderShipmentStatus('something_new_in_2027')).toBe('unknown')
  })

  it('treats an absent value as label_created, which is a fact about the artifact', () => {
    // We are holding a label record we just fetched, so a label demonstrably was
    // created. That is not an inference about the carrier.
    expect(normalizeProviderShipmentStatus(undefined)).toBe('label_created')
    expect(normalizeProviderShipmentStatus(null)).toBe('label_created')
    expect(normalizeProviderShipmentStatus('')).toBe('label_created')
  })
})
