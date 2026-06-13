// src/triggers/shipment-tracker/shipment-tracker-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

/**
 * Workflow-native FedEx trigger. Unlike `fedex.shipment-status-changed` (which
 * watches the agent-populated KV registry), this trigger is configured entirely
 * from its panel — the workflow author supplies the tracking numbers and/or a
 * reference to watch, so it fires without any agent involvement.
 */
export const shipmentTrackerSchema = {
  inputs: {
    trackingNumbers: Workflow.string({
      label: 'Tracking numbers',
      description:
        'One or more FedEx tracking numbers, comma- or newline-separated. Bind a workflow variable to watch a dynamic set.',
      acceptsVariables: true,
    }).optional(),
    reference: Workflow.string({
      label: 'Reference',
      description:
        'Optionally watch all shipments matching a PO / invoice / customer reference, in addition to any explicit numbers.',
      acceptsVariables: true,
    }).optional(),
    referenceType: Workflow.select({
      label: 'Reference type',
      options: [
        { value: 'CUSTOMER_REFERENCE', label: 'Customer reference' },
        { value: 'PURCHASE_ORDER', label: 'Purchase order' },
        { value: 'INVOICE', label: 'Invoice' },
        { value: 'BILL_OF_LADING', label: 'Bill of lading' },
        { value: 'PART_NUMBER', label: 'Part number' },
      ],
      default: 'CUSTOMER_REFERENCE',
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
        { value: 'out_for_delivery', label: 'Out for delivery' },
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
    statusCode: Workflow.string({ label: 'FedEx status code' }),
    statusDescription: Workflow.string({ label: 'Status description' }),
    location: Workflow.string({ label: 'Location' }),
    estimatedDelivery: Workflow.string({ label: 'Estimated delivery' }),
    deliveredAt: Workflow.string({ label: 'Delivered at' }),
    isDelivered: Workflow.boolean({ label: 'Is delivered' }),
    isException: Workflow.boolean({ label: 'Is exception' }),
    isDelayed: Workflow.boolean({ label: 'Is delayed' }),
    recordId: Workflow.string({ label: 'Linked record id' }),
  },
} satisfies WorkflowSchema
