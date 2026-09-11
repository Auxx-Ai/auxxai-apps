// tests/roll-up.test.ts

/**
 * The `ShipmentStatus` ladder: the roll-up (rung 1), the tracking-status
 * normalizer (rung 2) and `deriveShipmentStatus`, which orders all four rungs.
 *
 * These are the pure functions the connector server exists for: a mapping field
 * is a `sourcePath` to `target` binding with no transform hook, so the
 * normalized value has to be emitted already-shaped. Everything asserted here is
 * the rule from `shared-shipment-entities-proposal.md` §6 and §8d, and from
 * `shipstation-status-and-linking-plan.md` §3.
 */

import { describe, expect, it } from 'vitest'
import {
  type RollUpParcel,
  deriveShipmentStatus,
  normalizeLabelTrackingStatus,
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

describe('normalizeLabelTrackingStatus', () => {
  it('maps the two transit values the live probe observed', () => {
    // 50 labels on 2026-09-11 carried exactly three distinct values. These are
    // the two that say something about where the shipment is.
    expect(normalizeLabelTrackingStatus('in_transit')).toBe('in_transit')
    expect(normalizeLabelTrackingStatus('delivered')).toBe('delivered')
  })

  it('returns null for the provider saying unknown, rather than passing it through', () => {
    // Our enum has an `unknown` member and this is NOT it. The provider saying
    // `unknown` is the provider declining to answer.
    expect(normalizeLabelTrackingStatus('unknown')).toBeNull()
  })

  it('returns null for anything unenumerated, and never guesses', () => {
    // Plausible-looking strings the probe never saw. A value list copied out of
    // vendor documentation is exactly what build plan §2 forbids, so none of
    // these may be interpreted, not even the ones that happen to spell a member
    // of our own enum.
    expect(normalizeLabelTrackingStatus('out_for_delivery')).toBeNull()
    expect(normalizeLabelTrackingStatus('exception')).toBeNull()
    expect(normalizeLabelTrackingStatus('IN_TRANSIT')).toBeNull()
    expect(normalizeLabelTrackingStatus('something_new_in_2027')).toBeNull()
    expect(normalizeLabelTrackingStatus('')).toBeNull()
    expect(normalizeLabelTrackingStatus(null)).toBeNull()
    expect(normalizeLabelTrackingStatus(undefined)).toBeNull()
  })

  it('🛑 never answers our own `unknown` for any input at all', () => {
    // The single most important property of this function. `unknown` belongs to
    // rung 4 and to nothing else, because writing it in place of a null would
    // erase a fact we hold: that a label was printed.
    const inputs = [
      'in_transit',
      'delivered',
      'unknown',
      'exception',
      'out_for_delivery',
      'something_new_in_2027',
      '',
      null,
      undefined,
    ]
    for (const input of inputs) {
      expect(normalizeLabelTrackingStatus(input)).not.toBe('unknown')
    }
  })
})

describe('deriveShipmentStatus, the four-rung ladder', () => {
  it('rung 1: rolls up per-box status when any box carries one, outranking the label', () => {
    // A box-level fact beats a label-level indicator. The label says everything
    // is still moving; a box says it is in exception, and the shipment says so.
    expect(deriveShipmentStatus([active('in_transit'), active('exception')], 'in_transit')).toBe(
      'exception'
    )
    // Even one box with a status is enough to take the decision off the label.
    expect(deriveShipmentStatus([active('delivered'), active(null)], 'in_transit')).toBe(
      'partially_delivered'
    )
  })

  it('rung 2: uses the live label tracking status when no box has one', () => {
    expect(deriveShipmentStatus([active(null), active(null)], 'in_transit')).toBe('in_transit')
    expect(deriveShipmentStatus([active(null)], 'delivered')).toBe('delivered')
  })

  it('🛑 rung 3: an unenumerated or absent tracking status falls to label_created', () => {
    // THE case this ladder exists to get right. A null from the normalizer means
    // "no transit opinion", and we are holding a live label, so the honest answer
    // is that a label was printed. Answering `unknown` would erase that.
    expect(deriveShipmentStatus([active(null)], 'unknown')).toBe('label_created')
    expect(deriveShipmentStatus([active(null)], 'something_new_in_2027')).toBe('label_created')
    expect(deriveShipmentStatus([active(null)], null)).toBe('label_created')
    expect(deriveShipmentStatus([active(null)], undefined)).toBe('label_created')
    expect(deriveShipmentStatus([active(null)], '')).toBe('label_created')
  })

  it('rung 4: a shipment with no live label is unknown, whatever the label said', () => {
    // Every box voided, so there is no live label and we hold nothing at all,
    // not even "a label was printed". This is the ONLY honest use of `unknown`,
    // and it stands even though the voided labels still report `in_transit`,
    // which they demonstrably do (probe §3).
    expect(deriveShipmentStatus([voided('in_transit'), voided('delivered')], 'in_transit')).toBe(
      'unknown'
    )
    expect(deriveShipmentStatus([], 'delivered')).toBe('unknown')
  })

  it('ignores voided boxes when deciding which rung applies', () => {
    // A voided box carrying a status must not drag the decision onto rung 1,
    // where the roll-up would then answer from the live box's null.
    expect(deriveShipmentStatus([voided('exception'), active(null)], 'delivered')).toBe('delivered')
  })

  it('is not clamped forward-only, so a delivered shipment can still be returned', () => {
    // Status plan §3.4: `delivered -> returned_to_shipper` is legitimate and a
    // monotonic clamp would block it. Nothing here remembers a previous value.
    expect(deriveShipmentStatus([active('returned_to_shipper')], 'delivered')).toBe(
      'returned_to_shipper'
    )
    expect(deriveShipmentStatus([active(null)], 'in_transit')).toBe('in_transit')
  })
})
