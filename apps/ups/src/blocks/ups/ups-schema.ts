// src/blocks/ups/ups-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

/** Flattened shipment outputs — one scalar field per value, mirrors {@link FlatShipment}. */
const shipmentOutputs = {
  found: Workflow.boolean({ label: 'Found' }),
  trackingNumber: Workflow.string({ label: 'Tracking number' }),
  statusType: Workflow.string({ label: 'Status' }),
  statusCode: Workflow.string({ label: 'UPS status code' }),
  statusDescription: Workflow.string({ label: 'Status description' }),
  estimatedDelivery: Workflow.string({ label: 'Estimated delivery' }),
  deliveredAt: Workflow.string({ label: 'Delivered at' }),
  isDelivered: Workflow.boolean({ label: 'Is delivered' }),
  isException: Workflow.boolean({ label: 'Is exception' }),
  lastActivityDate: Workflow.string({ label: 'Last activity date' }),
  lastActivityLocation: Workflow.string({ label: 'Last activity location' }),
  lastActivityDescription: Workflow.string({ label: 'Last activity description' }),
  service: Workflow.string({ label: 'Service' }),
  weight: Workflow.string({ label: 'Weight' }),
  proofOfDelivery: Workflow.string({ label: 'Proof of delivery' }),
  signature: Workflow.string({ label: 'Signature' }),
}

export const upsSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [{ value: 'shipment', label: 'Shipment' }],
      default: 'shipment',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: [
        { value: 'track', label: 'Track by number' },
        { value: 'watch', label: 'Watch shipment' },
        { value: 'unwatch', label: 'Unwatch shipment' },
      ],
      default: 'track',
    }),

    // track / watch / unwatch
    trackingNumber: Workflow.string({
      label: 'Tracking number',
      description: 'UPS tracking number (usually starts 1Z). Bind an upstream value or type one.',
      acceptsVariables: true,
    }),

    // track only — opt-in delivery proof (bloats output; off by default)
    includeProofOfDelivery: Workflow.boolean({ label: 'Include proof of delivery' }),
    includeSignature: Workflow.boolean({ label: 'Include signature' }),

    // watch
    recordId: Workflow.string({
      label: 'Linked record id',
      description: 'Optional Auxx record id to link the shipment to.',
      acceptsVariables: true,
    }),
  },
  outputs: {},
  computeOutputs: (inputs: { operation?: string }) => {
    switch (inputs.operation) {
      case 'track':
        return shipmentOutputs
      case 'watch':
        return {
          watched: Workflow.boolean({ label: 'Watched' }),
          currentStatus: Workflow.string({ label: 'Current status' }),
          expiresAt: Workflow.string({ label: 'Expires at' }),
        }
      case 'unwatch':
        return { removed: Workflow.boolean({ label: 'Removed' }) }
      default:
        return {}
    }
  },
} satisfies WorkflowSchema
