// src/triggers/shipment-status-changed/shipment-status-changed-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

export const shipmentStatusChangedSchema = {
  inputs: {
    statusTypes: Workflow.select({
      label: 'Status changes to fire on',
      description:
        'Only fire when a watched shipment enters one of these states. Leave empty for all changes.',
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
