// src/blocks/fedex/fedex-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

/** Flattened shipment outputs — one scalar field per value, mirrors {@link FlatShipment}. */
const shipmentOutputs = {
  found: Workflow.boolean({ label: 'Found' }),
  trackingNumber: Workflow.string({ label: 'Tracking number' }),
  matchCount: Workflow.number({ label: 'Match count' }),
  statusType: Workflow.string({ label: 'Status' }),
  statusCode: Workflow.string({ label: 'FedEx status code' }),
  statusDescription: Workflow.string({ label: 'Status description' }),
  estimatedDelivery: Workflow.string({ label: 'Estimated delivery' }),
  deliveredAt: Workflow.string({ label: 'Delivered at' }),
  isDelivered: Workflow.boolean({ label: 'Is delivered' }),
  isException: Workflow.boolean({ label: 'Is exception' }),
  isDelayed: Workflow.boolean({ label: 'Is delayed' }),
  lastActivityDate: Workflow.string({ label: 'Last activity date' }),
  lastActivityLocation: Workflow.string({ label: 'Last activity location' }),
  lastActivityDescription: Workflow.string({ label: 'Last activity description' }),
  service: Workflow.string({ label: 'Service' }),
  receivedByName: Workflow.string({ label: 'Received by' }),
}

export const fedexSchema = {
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
        { value: 'trackByReference', label: 'Track by reference' },
        { value: 'watch', label: 'Watch shipment' },
        { value: 'unwatch', label: 'Unwatch shipment' },
      ],
      default: 'track',
    }),

    // track / watch / unwatch
    trackingNumber: Workflow.string({
      label: 'Tracking number',
      description: 'FedEx tracking number. Bind an upstream value or type one.',
      acceptsVariables: true,
    }),

    // trackByReference
    reference: Workflow.string({
      label: 'Reference',
      description: 'Order number, PO, invoice, etc.',
      acceptsVariables: true,
    }),
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
    }),
    shipDateBegin: Workflow.string({
      label: 'Ship date from',
      description: 'Optional ISO date (YYYY-MM-DD). Defaults to 30 days ago.',
      acceptsVariables: true,
    }),
    shipDateEnd: Workflow.string({
      label: 'Ship date to',
      description: 'Optional ISO date (YYYY-MM-DD). Defaults to today.',
      acceptsVariables: true,
    }),

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
      case 'trackByReference':
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
