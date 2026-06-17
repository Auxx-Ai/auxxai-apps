// src/triggers/shipment-tracker/shipment-tracker-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

/**
 * Workflow-native UPS trigger. Unlike `ups.shipment-status-changed` (which
 * watches the agent-populated KV registry), this trigger is configured entirely
 * from its panel — the workflow author supplies the tracking numbers to watch,
 * so it fires without any agent involvement.
 *
 * UPS Tracking v1 has no reference lookup, so (unlike the FedEx tracker) there
 * are no reference inputs, and `statusTypes` omits `out_for_delivery` (UPS folds
 * it into `in_transit`).
 */
export const shipmentTrackerSchema = {
  inputs: {
    trackingNumbers: Workflow.string({
      label: 'Tracking numbers',
      description:
        'One or more UPS tracking numbers, comma- or newline-separated. Bind a workflow variable to watch a dynamic set.',
      acceptsVariables: true,
    }).optional(),
    statusTypes: Workflow.select({
      label: 'Status changes to fire on',
      description:
        'Only fire when a shipment enters one of these states. Leave empty for all changes.',
      multi: true,
      options: [
        { value: 'label_created', label: 'Label created' },
        { value: 'picked_up', label: 'Picked up' },
        { value: 'in_transit', label: 'In transit' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'exception', label: 'Exception' },
        { value: 'returned_to_shipper', label: 'Returned to shipper' },
      ],
      default: [],
    }).optional(),
  },
  outputs: {
    trackingNumber: Workflow.string({ label: 'Tracking number' }),
    previousStatus: Workflow.string({ label: 'Previous status' }),
    status: Workflow.string({ label: 'New status' }),
    statusCode: Workflow.string({ label: 'UPS status code' }),
    statusDescription: Workflow.string({ label: 'Status description' }),
    location: Workflow.string({ label: 'Location' }),
    estimatedDelivery: Workflow.string({ label: 'Estimated delivery' }),
    deliveredAt: Workflow.string({ label: 'Delivered at' }),
    isDelivered: Workflow.boolean({ label: 'Is delivered' }),
    isException: Workflow.boolean({ label: 'Is exception' }),
    recordId: Workflow.string({ label: 'Linked record id' }),
  },
} satisfies WorkflowSchema
