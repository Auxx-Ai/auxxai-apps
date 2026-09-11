// src/tools/get-shipstation-shipment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../assets/icon.png'
import getShipstationShipmentExecute from './get-shipstation-shipment.tool.server'

/**
 * Fields every shipment row carries, list or detail. Exported so
 * `list-shipstation-shipments.tool.tsx` describes exactly the same shape rather
 * than a second, drifting copy.
 */
export const shipmentSummarySchema = z.object({
  shipmentId: z.string().describe('ShipStation shipment id, e.g. se-428778294.'),
  shipmentNumber: z.string().nullable().describe('The order source’s shipment number.'),
  externalShipmentId: z
    .string()
    .nullable()
    .describe(
      'Raw upstream id as ShipStation reports it. Its commerce meaning is unverified. Do not parse it into order or fulfillment ids.'
    ),
  externalOrderId: z.string().nullable(),
  storeId: z.string().nullable(),
  shipmentStatus: z
    .string()
    .nullable()
    .describe('pending, processing, label_purchased or cancelled.'),
  carrierId: z.string().nullable(),
  serviceCode: z.string().nullable(),
  warehouseId: z.string().nullable(),
  isReturn: z.boolean(),
  shipDate: z.string().nullable(),
  createdAt: z.string().nullable(),
  modifiedAt: z.string().nullable(),
  shipToName: z.string().nullable(),
  shipToPlace: z.string().nullable().describe('City, state and country of the recipient.'),
  packageCount: z.number(),
  itemCount: z.number(),
  totalWeight: z.object({ value: z.number(), unit: z.string() }).nullable(),
  tags: z.array(z.string()),
})

/** A shipment with its recipient address, boxes and line items. */
export const shipmentSchema = shipmentSummarySchema.extend({
  confirmation: z.string().nullable().describe('Delivery confirmation level requested.'),
  orderSourceCode: z.string().nullable(),
  batchIds: z.array(z.string()),
  shipTo: z
    .object({
      name: z.string().nullable(),
      companyName: z.string().nullable(),
      addressLine1: z.string().nullable(),
      addressLine2: z.string().nullable(),
      addressLine3: z.string().nullable(),
      cityLocality: z.string().nullable(),
      stateProvince: z.string().nullable(),
      postalCode: z.string().nullable(),
      countryCode: z.string().nullable(),
      residential: z
        .boolean()
        .nullable()
        .describe('Null when the carrier has not classified the address.'),
    })
    .nullable()
    .describe(
      'Recipient address. Email and phone are deliberately not returned: take contact details from the ticket, not from here.'
    ),
  packages: z
    .array(
      z.object({
        shipmentPackageId: z.string().nullable(),
        packageCode: z.string().nullable(),
        packageName: z.string().nullable(),
        externalPackageId: z.string().nullable(),
        contentDescription: z.string().nullable(),
        weight: z.object({ value: z.number(), unit: z.string() }).nullable(),
        dimensions: z
          .object({
            length: z.number(),
            width: z.number(),
            height: z.number(),
            unit: z.string(),
          })
          .nullable(),
      })
    )
    .describe(
      'Boxes as planned on the shipment. These carry NO tracking numbers; tracking lives on the label. Use get_shipstation_shipment_packages for that.'
    ),
  items: z
    .array(
      z.object({
        name: z.string().nullable(),
        sku: z.string().nullable(),
        quantity: z.number().nullable(),
        unitPrice: z.number().nullable(),
        salesOrderId: z.string().nullable(),
        externalOrderId: z.string().nullable(),
      })
    )
    .describe('Line items on the shipment, when the order source supplied them.'),
})

export const exampleShipmentSummary = {
  shipmentId: 'se-428778294',
  shipmentNumber: '14530',
  externalShipmentId: '7489518207152-8681743417520',
  externalOrderId: '17954843328688',
  storeId: 'se-2943015',
  shipmentStatus: 'label_purchased',
  carrierId: 'se-3891373',
  serviceCode: 'fedex_home_delivery',
  warehouseId: 'se-1044188',
  isReturn: false,
  shipDate: '2026-09-10T00:00:00Z',
  createdAt: '2026-09-09T18:12:04.000Z',
  modifiedAt: '2026-09-10T07:02:11.000Z',
  shipToName: 'Dana Whitfield',
  shipToPlace: 'Austin, TX, US',
  packageCount: 3,
  itemCount: 2,
  totalWeight: { value: 2448, unit: 'ounce' },
  tags: ['Fragile'],
}

const exampleShipment = {
  ...exampleShipmentSummary,
  confirmation: 'none',
  orderSourceCode: 'shopify',
  batchIds: [],
  shipTo: {
    name: 'Dana Whitfield',
    companyName: null,
    addressLine1: '1209 Bell Springs Rd',
    addressLine2: null,
    addressLine3: null,
    cityLocality: 'Austin',
    stateProvince: 'TX',
    postalCode: '78704',
    countryCode: 'US',
    residential: true,
  },
  packages: [
    {
      shipmentPackageId: 'se-3',
      packageCode: 'package',
      packageName: 'Package',
      externalPackageId: null,
      contentDescription: null,
      weight: { value: 1280, unit: 'ounce' },
      dimensions: { length: 71, width: 6, height: 13, unit: 'inch' },
    },
  ],
  items: [
    {
      name: 'Vertical Lift 900',
      sku: 'VL-900',
      quantity: 1,
      unitPrice: 2499,
      salesOrderId: null,
      externalOrderId: '17954843328688',
    },
  ],
}

/** One shipment in full, by ShipStation id or by the order source's own id. */
export const getShipstationShipmentTool = defineTool({
  id: 'get_shipstation_shipment',
  name: 'Get ShipStation shipment',
  description:
    'Get one ShipStation shipment in full: status, carrier and service, recipient city and ' +
    'address, the boxes as planned, and the line items. Look it up either by its ShipStation ' +
    "id (se-428778294, idKind 'shipstation') or by the order source's own external shipment id " +
    "(idKind 'external'). " +
    'This is the shipment RECORD, not the carrier status: the boxes here carry no tracking ' +
    'numbers. Use get_shipstation_shipment_packages for the labels and their tracking numbers, ' +
    'and get_shipstation_tracking for where a parcel actually is.',
  icon: shipstationIcon,
  inputs: z.object({
    shipmentId: z
      .string()
      .describe('The id to look up. Which kind it is is decided by idKind, not by its shape.'),
    idKind: z
      .enum(['shipstation', 'external'])
      .optional()
      .describe(
        "'shipstation' (the default) for a se-* shipment id; 'external' for the order " +
          "source's own external shipment id."
      ),
  }),
  outputs: z.object({ shipment: shipmentSchema }),
  exampleOutput: { shipment: exampleShipment },
  config: { requiresConnection: true, idempotent: true, timeout: 15000 },
  execute: getShipstationShipmentExecute,
  // Not externally safe. See src/tools/toolsets.ts.
  agent: { toolsetSlug: 'shipstation.read' },
})
