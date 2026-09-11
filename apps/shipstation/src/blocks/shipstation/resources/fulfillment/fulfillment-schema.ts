// src/blocks/shipstation/resources/fulfillment/fulfillment-schema.ts

/**
 * The `fulfillment` resource: one operation, `getMany`.
 *
 * 🛑 This is the ONLY list in the block searchable by a CHILD tracking number.
 * The build plan's live probe found `GET /v2/labels?tracking_number=` returned
 * no matches for a child parcel of a multi-package shipment — a label matches
 * only on its own master number. `GET /v2/fulfillments?tracking_number=` is the
 * list to reach for when all you have is a number a customer read off a box.
 */

import { Workflow } from '@auxx/sdk'

export const fulfillmentInputs = {
  // --- Fulfillment: Get Many ---
  fulfillmentGetManyTrackingNumber: Workflow.string({
    label: 'Tracking Number',
    description:
      'Matches a child box, not just the master number. This is the only list in this block that does.',
    acceptsVariables: true,
  }),
  fulfillmentGetManyShipmentId: Workflow.string({
    label: 'Shipment ID',
    acceptsVariables: true,
  }),
  fulfillmentGetManyFulfillmentId: Workflow.string({
    label: 'Fulfillment ID',
    acceptsVariables: true,
  }),
  fulfillmentGetManyShipmentNumber: Workflow.string({
    label: 'Shipment Number',
    description: 'The order number as the store sent it.',
    acceptsVariables: true,
  }),
  fulfillmentGetManyBatchId: Workflow.string({ label: 'Batch ID', acceptsVariables: true }),
  fulfillmentGetManyOrderSourceId: Workflow.string({
    label: 'Order Source ID',
    description: 'The ShipStation store id.',
    acceptsVariables: true,
  }),
  fulfillmentGetManyShipToName: Workflow.string({
    label: 'Ship To Name',
    acceptsVariables: true,
  }),
  fulfillmentGetManyShipDateStart: Workflow.datetime({
    label: 'Ship Date From',
    description: 'Inclusive.',
    acceptsVariables: true,
  }),
  fulfillmentGetManyShipDateEnd: Workflow.datetime({
    label: 'Ship Date To',
    description: 'Inclusive.',
    acceptsVariables: true,
  }),
  fulfillmentGetManyCreateDateStart: Workflow.datetime({
    label: 'Created From',
    description: 'Inclusive.',
    acceptsVariables: true,
  }),
  fulfillmentGetManyCreateDateEnd: Workflow.datetime({
    label: 'Created To',
    description: 'Inclusive.',
    acceptsVariables: true,
  }),
  fulfillmentGetManyPage: Workflow.number({
    label: 'Page',
    description: 'First page is 1.',
    integer: true,
    min: 1,
    acceptsVariables: true,
  }),
  fulfillmentGetManyPageSize: Workflow.number({
    label: 'Page Size',
    description: 'ShipStation defaults to 25 and allows at most 500.',
    integer: true,
    min: 1,
    max: 500,
    acceptsVariables: true,
  }),
  fulfillmentGetManySortBy: Workflow.select({
    label: 'Sort By',
    options: [
      { value: '', label: 'Default (created at)' },
      { value: 'created_at', label: 'Created At' },
      { value: 'modified_at', label: 'Modified At' },
      { value: 'shipped_at', label: 'Shipped At' },
    ],
    default: '',
  }),
  fulfillmentGetManySortDir: Workflow.select({
    label: 'Sort Direction',
    options: [
      { value: '', label: 'Default (ascending)' },
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
    default: '',
  }),
}

const fulfillmentFields = {
  fulfillmentId: Workflow.string({ label: 'fulfillmentId' }),
  shipmentId: Workflow.string({ label: 'shipmentId' }),
  shipmentNumber: Workflow.string({ label: 'shipmentNumber' }),
  trackingNumber: Workflow.string({ label: 'trackingNumber' }),
  carrierFriendlyName: Workflow.string({ label: 'carrierFriendlyName' }),
  fulfillmentProviderCode: Workflow.string({ label: 'fulfillmentProviderCode' }),
  fulfillmentServiceCode: Workflow.string({ label: 'fulfillmentServiceCode' }),
  createdAt: Workflow.datetime({ label: 'createdAt' }),
  shipDate: Workflow.datetime({ label: 'shipDate' }),
  deliveredAt: Workflow.datetime({ label: 'deliveredAt' }),
  voidedAt: Workflow.datetime({ label: 'voidedAt' }),
  voided: Workflow.boolean({ label: 'voided' }),
  voidRequested: Workflow.boolean({ label: 'voidRequested' }),
  orderSourceNotified: Workflow.boolean({ label: 'orderSourceNotified' }),
  feeAmount: Workflow.number({ label: 'feeAmount' }),
  feeCurrency: Workflow.string({ label: 'feeCurrency' }),
  shipToName: Workflow.string({ label: 'shipToName' }),
  shipToCity: Workflow.string({ label: 'shipToCity' }),
  shipToState: Workflow.string({ label: 'shipToState' }),
  shipToPostalCode: Workflow.string({ label: 'shipToPostalCode' }),
  shipToCountry: Workflow.string({ label: 'shipToCountry' }),
}

/** The variables `fulfillment.getMany` publishes downstream. */
export function fulfillmentComputeOutputs(operation: string) {
  if (operation === 'getMany') {
    return {
      fulfillments: Workflow.array({
        label: 'fulfillments',
        items: Workflow.struct(fulfillmentFields, { label: 'fulfillment' }),
      }),
      count: Workflow.number({
        label: 'count',
        description: 'Rows on this page. Read `total` for the size of the whole match.',
        integer: true,
      }),
      total: Workflow.number({ label: 'total', integer: true }),
      page: Workflow.number({ label: 'page', integer: true }),
      pages: Workflow.number({ label: 'pages', integer: true }),
    }
  }
  return {}
}
