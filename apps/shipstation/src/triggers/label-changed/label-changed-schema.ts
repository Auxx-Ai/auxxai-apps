// src/triggers/label-changed/label-changed-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

/**
 * `shipstation.label-changed` — one trigger, two cursors.
 *
 * `GET /v2/labels` has no `modified_at_start` filter, and `modified_at` is never
 * returned on a label object even though it is a legal `sort_by`. A single
 * "sort by modified_at and stop at the watermark" delta is therefore NOT
 * implementable: the stop value is a field the API sorts on and never hands
 * back. See the build plan, "The delta that IS available".
 *
 * What is implementable is two deltas whose watermark the response actually
 * carries, joined into one trigger because they share a panel and a consumer:
 *
 * - new labels: `created_at_start`, `sort_by=created_at`, ascending
 * - voids: `label_status=voided`, `sort_by=voided_at`, descending
 *
 * Each event names which branch produced it in `changeType`, and the panel's
 * `changeTypes` multi-select narrows that the same way `fedex.shipment-tracker`
 * narrows `statusTypes`.
 */
export const labelChangedSchema = {
  inputs: {
    changeTypes: Workflow.select({
      label: 'Changes to fire on',
      description:
        'Leave empty for both. A label created and then voided in the same window produces one event of each.',
      multi: true,
      options: [
        { value: 'created', label: 'Label created' },
        { value: 'voided', label: 'Label voided' },
      ],
      default: [],
    }).optional(),
    carrierId: Workflow.string({
      label: 'Carrier',
      description:
        'Optional ShipStation carrier id (looks like `se-12345`). Leave empty to watch every carrier on the account.',
      acceptsVariables: true,
    }).optional(),
    serviceCode: Workflow.string({
      label: 'Service code',
      description: 'Optional carrier service code, for example `fedex_home_delivery`.',
      acceptsVariables: true,
    }).optional(),
    warehouseId: Workflow.string({
      label: 'Warehouse',
      description: 'Optional ShipStation warehouse id (looks like `se-12345`).',
      acceptsVariables: true,
    }).optional(),
  },
  outputs: {
    changeType: Workflow.string({
      label: 'Change type',
      description: '`created` or `voided`.',
    }),
    labelId: Workflow.string({ label: 'Label id' }),
    shipmentId: Workflow.string({ label: 'Shipment id' }),
    externalShipmentId: Workflow.string({ label: 'External shipment id' }),
    externalOrderId: Workflow.string({ label: 'External order id' }),
    carrierCode: Workflow.string({ label: 'Carrier code' }),
    carrierId: Workflow.string({ label: 'Carrier id' }),
    serviceCode: Workflow.string({ label: 'Service code' }),
    trackingNumber: Workflow.string({
      label: 'Tracking number',
      description: 'The label-level master tracking number.',
    }),
    trackingNumbers: Workflow.string({
      label: 'All tracking numbers',
      description: 'Every box on the label, comma-separated, ordered as ShipStation returns them.',
    }),
    packageCount: Workflow.number({ label: 'Package count' }),
    labelStatus: Workflow.string({ label: 'Label status' }),
    trackingStatus: Workflow.string({
      label: 'Tracking status',
      description:
        'Label-level carrier status. Applies to the label as a whole and can disagree with a live carrier lookup; do not read it as per-box truth.',
    }),
    isReturnLabel: Workflow.boolean({ label: 'Is return label' }),
    voided: Workflow.boolean({ label: 'Voided' }),
    voidedAt: Workflow.string({ label: 'Voided at' }),
    voidType: Workflow.string({ label: 'Void type' }),
    shipDate: Workflow.string({ label: 'Ship date' }),
    createdAt: Workflow.string({ label: 'Created at' }),
  },
} satisfies WorkflowSchema
