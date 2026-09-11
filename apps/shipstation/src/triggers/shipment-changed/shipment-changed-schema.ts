// src/triggers/shipment-changed/shipment-changed-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'

/**
 * `shipstation.shipment-changed` — a true `modified_at` delta over
 * `GET /v2/shipments`.
 *
 * `modified_at` is both a filter (`modified_at_start`) and a field the response
 * carries, so the watermark is the greatest `modified_at` actually seen. That
 * makes this the only one of the three ShipStation streams that needs no
 * second cursor and no snapshot.
 *
 * The panel declares only what to watch. The platform renders the polling
 * interval selector itself, so no interval field belongs here.
 */
export const shipmentChangedSchema = {
  inputs: {
    storeId: Workflow.string({
      label: 'Store',
      description:
        'Optional ShipStation store id (looks like `se-12345`). Leave empty to watch every store on the account.',
      acceptsVariables: true,
    }).optional(),
    shipmentStatus: Workflow.select({
      label: 'Shipment status',
      description:
        'Optional. Only fire for shipments currently in this status. Leave empty for every status.',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'label_purchased', label: 'Label purchased' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    }).optional(),
    tag: Workflow.string({
      label: 'Tag',
      description: 'Optional ShipStation tag name. Only shipments carrying this tag are watched.',
      acceptsVariables: true,
    }).optional(),
  },
  outputs: {
    shipmentId: Workflow.string({ label: 'Shipment id' }),
    shipmentNumber: Workflow.string({ label: 'Shipment number' }),
    externalShipmentId: Workflow.string({ label: 'External shipment id' }),
    externalOrderId: Workflow.string({ label: 'External order id' }),
    salesOrderId: Workflow.string({ label: 'Sales order id' }),
    shipmentStatus: Workflow.string({ label: 'Shipment status' }),
    storeId: Workflow.string({ label: 'Store id' }),
    warehouseId: Workflow.string({ label: 'Warehouse id' }),
    carrierId: Workflow.string({ label: 'Carrier id' }),
    serviceCode: Workflow.string({ label: 'Service code' }),
    shipToName: Workflow.string({ label: 'Ship-to name' }),
    tags: Workflow.string({ label: 'Tags', description: 'Comma-separated tag names.' }),
    isReturn: Workflow.boolean({ label: 'Is return' }),
    shipDate: Workflow.string({ label: 'Ship date' }),
    createdAt: Workflow.string({ label: 'Created at' }),
    modifiedAt: Workflow.string({ label: 'Modified at' }),
  },
} satisfies WorkflowSchema
