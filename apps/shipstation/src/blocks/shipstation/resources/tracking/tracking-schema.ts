// src/blocks/shipstation/resources/tracking/tracking-schema.ts

/**
 * The `tracking` resource: one operation, `get`.
 *
 * `GET /v2/tracking?carrier_code=&tracking_number=` is the highest-value read
 * in this block. It returns PER-PARCEL live carrier status without the carrier
 * (FedEx, UPS) being connected to Auxx at all.
 *
 * It is also the honest answer to the finding recorded in the build plan §9:
 * a label's own `tracking_status` lies. That field read `in_transit` on labels
 * that had been voided, while `GET /v2/labels/{id}/track` for the same label
 * answered "Not Yet In System". `label.track` remains in the block as the
 * master-tracking lookup; this is the one to reach for when the question is
 * "where is this box".
 *
 * `POST /v2/tracking/start` and `/v2/tracking/stop` are deliberately absent.
 * They exist only to drive `track_event_v2` webhooks, and this app polls
 * (plan §1 decision 3), so there is no consumer for them.
 *
 * Input keys follow the block convention `<resource><Operation><Field>`, because
 * all seven resources flatten into one `inputs` namespace.
 */

import { Workflow } from '@auxx/sdk'

/** How the carrier is named on a tracking lookup. */
export const TRACKING_CARRIER_MODES = [
  { value: 'code', label: 'Carrier code' },
  { value: 'id', label: 'Connected carrier' },
] as const

export const trackingInputs = {
  // --- Tracking: Get ---
  trackingGetTrackingNumber: Workflow.string({
    label: 'Tracking number',
    description: 'The parcel tracking number. Bind this from the upstream label or fulfilment.',
    acceptsVariables: true,
    required: true,
  }),
  trackingGetCarrierBy: Workflow.select({
    label: 'Identify the carrier by',
    description:
      'ShipStation needs the carrier as well as the number. Use a code for a carrier bound from an upstream record, or pick a connected carrier account.',
    options: [...TRACKING_CARRIER_MODES],
    default: 'code',
  }),
  trackingGetCarrierCode: Workflow.string({
    label: 'Carrier code',
    description: "ShipStation's carrier code, for example usps, fedex, ups or stamps_com.",
    acceptsVariables: true,
  }),
  trackingGetCarrierId: Workflow.select({
    label: 'Carrier',
    description: 'A carrier account connected to this ShipStation installation.',
    options: [] as { value: string; label: string }[],
    acceptsVariables: true,
  }),
}

/**
 * One carrier scan.
 *
 * `occurredAt` is ShipStation's normalised timestamp and `carrierOccurredAt` is
 * the carrier's own, which is usually local time without an offset. They are
 * both surfaced rather than reconciled, because picking one silently would hide
 * a timezone the operator may need.
 */
const trackingEventFields = {
  occurredAt: Workflow.datetime(),
  carrierOccurredAt: Workflow.datetime(),
  description: Workflow.string(),
  statusCode: Workflow.string(),
  statusLabel: Workflow.string(),
  statusDescription: Workflow.string(),
  statusDetailCode: Workflow.string(),
  statusDetailDescription: Workflow.string(),
  carrierStatusCode: Workflow.string(),
  carrierStatusDescription: Workflow.string(),
  carrierDetailCode: Workflow.string(),
  eventCode: Workflow.string(),
  cityLocality: Workflow.string(),
  stateProvince: Workflow.string(),
  postalCode: Workflow.string(),
  countryCode: Workflow.string(),
  companyName: Workflow.string(),
  signer: Workflow.string(),
  latitude: Workflow.number(),
  longitude: Workflow.number(),
  proofOfDeliveryUrl: Workflow.string(),
}

/**
 * The parcel's current state.
 *
 * `statusCode` is ShipStation's two-letter code (UN, AC, IT, DE, EX, AT, NY, SP)
 * and is what a condition node should branch on, because it is stable.
 * `statusLabel` is that code spelled out and is always present; `statusDescription`
 * is whatever ShipStation returned and can be empty. Both exist on purpose: a
 * workflow that renders a status into an email needs a value that is never blank.
 */
const trackingFields = {
  trackingNumber: Workflow.string(),
  trackingUrl: Workflow.string(),
  statusCode: Workflow.string(),
  statusLabel: Workflow.string(),
  statusDescription: Workflow.string(),
  statusDetailCode: Workflow.string(),
  statusDetailDescription: Workflow.string(),
  carrierCode: Workflow.string(),
  carrierId: Workflow.string(),
  carrierStatusCode: Workflow.string(),
  carrierStatusDescription: Workflow.string(),
  carrierDetailCode: Workflow.string(),
  exceptionDescription: Workflow.string(),
  shipDate: Workflow.datetime(),
  estimatedDeliveryDate: Workflow.datetime(),
  actualDeliveryDate: Workflow.datetime(),
  delivered: Workflow.boolean(),
  exception: Workflow.boolean(),
  terminal: Workflow.boolean(),
}

/**
 * The variables a tracking operation publishes downstream.
 *
 * `delivered` is repeated at the top level as well as inside `tracking` because
 * branching on delivery is the overwhelmingly common next step, and a top-level
 * boolean is what a condition node binds to most cleanly.
 */
export function trackingComputeOutputs(operation: string) {
  if (operation === 'get') {
    return {
      tracking: Workflow.struct(trackingFields, { label: 'tracking' }),
      events: Workflow.array({
        label: 'events',
        items: Workflow.struct(trackingEventFields, { label: 'event' }),
      }),
      eventCount: Workflow.number({ label: 'eventCount', integer: true }),
      delivered: Workflow.boolean({ label: 'delivered' }),
    }
  }
  return {}
}
