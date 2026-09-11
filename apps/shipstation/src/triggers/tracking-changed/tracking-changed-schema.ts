// src/triggers/tracking-changed/tracking-changed-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

/**
 * `shipstation.tracking-changed` — the direct analogue of
 * `fedex.shipment-tracker`, over `GET /v2/tracking`.
 *
 * This is what lets ShipStation write parcel status without FedEx or UPS being
 * connected: `/v2/tracking?carrier_code=&tracking_number=` returns per-parcel
 * carrier status, unlike a label's `tracking_status`, which is label-level and
 * has been observed disagreeing with a live carrier lookup.
 *
 * Configured entirely from the panel, so it fires with no agent involvement.
 * Last-seen status per tracking number lives in the trigger's own polling
 * state, so two workflows watching the same parcel each observe every
 * transition.
 */
export const trackingChangedSchema = {
  inputs: {
    trackingNumbers: Workflow.string({
      label: 'Tracking numbers',
      description:
        'One or more tracking numbers, comma- or newline-separated. Bind a workflow variable to watch a dynamic set.',
      acceptsVariables: true,
    }).optional(),
    carrierCode: Workflow.string({
      label: 'Carrier code',
      description:
        'ShipStation carrier code for these parcels, for example `fedex`, `ups`, `stamps_com`. Leave empty to let ShipStation infer it.',
      acceptsVariables: true,
    }).optional(),
    statusCodes: Workflow.select({
      label: 'Status changes to fire on',
      description:
        'Only fire when a parcel enters one of these states. Leave empty for all changes.',
      multi: true,
      options: [
        { value: 'AC', label: 'Accepted' },
        { value: 'IT', label: 'In transit' },
        { value: 'AT', label: 'Delivery attempt' },
        { value: 'DE', label: 'Delivered' },
        { value: 'SP', label: 'Delivered to collection location' },
        { value: 'EX', label: 'Exception' },
        { value: 'NY', label: 'Not yet in system' },
        { value: 'UN', label: 'Unknown' },
      ],
      default: [],
    }).optional(),
  },
  outputs: {
    trackingNumber: Workflow.string({ label: 'Tracking number' }),
    carrierCode: Workflow.string({ label: 'Carrier code' }),
    previousStatus: Workflow.string({
      label: 'Previous status',
      description: 'ShipStation status code as of the previous poll.',
    }),
    status: Workflow.string({
      label: 'New status',
      description: 'ShipStation status code: UN, AC, IT, DE, EX, AT, NY or SP.',
    }),
    statusDescription: Workflow.string({ label: 'Status description' }),
    statusDetailCode: Workflow.string({ label: 'Status detail code' }),
    statusDetailDescription: Workflow.string({ label: 'Status detail description' }),
    carrierStatusCode: Workflow.string({ label: 'Carrier status code' }),
    carrierStatusDescription: Workflow.string({ label: 'Carrier status description' }),
    location: Workflow.string({
      label: 'Location',
      description: 'City, state and country of the most recent scan, where the carrier gives one.',
    }),
    occurredAt: Workflow.string({ label: 'Last scan at' }),
    estimatedDelivery: Workflow.string({ label: 'Estimated delivery' }),
    deliveredAt: Workflow.string({ label: 'Delivered at' }),
    exceptionDescription: Workflow.string({ label: 'Exception description' }),
    trackingUrl: Workflow.string({ label: 'Tracking URL' }),
    isDelivered: Workflow.boolean({ label: 'Is delivered' }),
    isException: Workflow.boolean({ label: 'Is exception' }),
    isReturned: Workflow.boolean({ label: 'Is returned to sender' }),
  },
} satisfies WorkflowSchema
