// src/tools/get-shipstation-tracking.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../assets/icon.png'
import getShipstationTrackingExecute from './get-shipstation-tracking.tool.server'

const trackEventSchema = z.object({
  occurredAt: z.string().nullable().describe('When the carrier recorded the scan.'),
  carrierOccurredAt: z
    .string()
    .nullable()
    .describe("The carrier's own local timestamp for the same scan, when it differs."),
  status: z
    .string()
    .nullable()
    .describe(
      'Readable status at this scan: accepted, in_transit, delivery_attempted, delivered, ' +
        'exception, not_yet_in_system, delivered_to_collection_location or unknown.'
    ),
  statusCode: z.string().nullable().describe("ShipStation's two-letter code, e.g. IT or DE."),
  description: z.string().nullable(),
  detailDescription: z.string().nullable(),
  carrierStatusCode: z.string().nullable(),
  carrierStatusDescription: z
    .string()
    .nullable()
    .describe("The carrier's own wording. Usually the most useful line to quote."),
  cityLocality: z.string().nullable(),
  stateProvince: z.string().nullable(),
  postalCode: z.string().nullable(),
  countryCode: z.string().nullable(),
  signer: z.string().nullable().describe('Who signed, on a delivery scan that captured one.'),
})

/**
 * Live per-parcel carrier tracking. The one tool that answers "where is this
 * box" truthfully; a label's own `trackingStatus` does not.
 */
export const getShipstationTrackingTool = defineTool({
  id: 'get_shipstation_tracking',
  name: 'Get ShipStation tracking',
  description:
    'Look up the LIVE carrier tracking status of one parcel by its tracking number plus the ' +
    'carrier it shipped with. Returns the carrier status, estimated and actual delivery dates, ' +
    'and the full scan history newest first. ' +
    'IMPORTANT: this is the authoritative status of a parcel. Prefer it over the trackingStatus ' +
    'field on a label from get_shipstation_label or list_shipstation_labels. That field is ' +
    'label-level, is not refreshed per box, and has been observed reading "in_transit" on ' +
    'voided labels and on parcels the carrier had not yet received. Each box on a multi-box ' +
    'label has its own tracking number, so call this once per box you are asked about. ' +
    'A carrier code or carrier id is required alongside the number: use ' +
    'list_shipstation_carriers, or read carrierCode off the label.',
  icon: shipstationIcon,
  inputs: z.object({
    trackingNumber: z.string().describe('The carrier tracking number for one box.'),
    carrierCode: z
      .string()
      .optional()
      .describe("Carrier code, e.g. 'fedex', 'usps', 'ups'. Give this or carrierId."),
    carrierId: z
      .string()
      .optional()
      .describe('ShipStation carrier account id, e.g. se-3891373. Give this or carrierCode.'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe('Readable rollup of the current status. Safe to quote directly when answering.'),
    trackingNumber: z.string(),
    carrierCode: z.string().nullable(),
    trackingUrl: z.string().nullable().describe("The carrier's public tracking page, if given."),
    status: z
      .string()
      .nullable()
      .describe(
        'Readable current status: accepted, in_transit, delivery_attempted, delivered, ' +
          'exception, not_yet_in_system, delivered_to_collection_location or unknown.'
      ),
    statusCode: z
      .string()
      .nullable()
      .describe('Raw two-letter code: UN, AC, IT, DE, EX, AT, NY, SP.'),
    statusDescription: z.string().nullable().describe("ShipStation's own wording for the status."),
    statusDetailCode: z.string().nullable(),
    statusDetailDescription: z.string().nullable(),
    carrierStatusCode: z.string().nullable(),
    carrierStatusDescription: z.string().nullable().describe("The carrier's own wording."),
    delivered: z.boolean(),
    inTransit: z.boolean().describe('True while the carrier has it and has not delivered it.'),
    exception: z
      .boolean()
      .describe('True on a delivery exception. Read exceptionDescription for what happened.'),
    shipDate: z.string().nullable(),
    estimatedDeliveryDate: z.string().nullable(),
    actualDeliveryDate: z.string().nullable(),
    exceptionDescription: z.string().nullable(),
    events: z.array(trackEventSchema).describe('Carrier scans, newest first.'),
    eventCount: z.number().describe('Total scans the carrier reported.'),
    eventsTruncated: z
      .boolean()
      .describe('True when older scans were dropped. Say so rather than implying this is all.'),
  }),
  exampleOutput: {
    summary:
      '770000000003: In Transit. Estimated delivery 2026-09-14. Last scan ' +
      '2026-09-11T14:02:00Z in Memphis, TN, US: In Transit.',
    trackingNumber: '770000000003',
    carrierCode: 'fedex',
    trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=770000000003',
    status: 'in_transit',
    statusCode: 'IT',
    statusDescription: 'In Transit',
    statusDetailCode: 'IN_TRANSIT',
    statusDetailDescription: 'In transit',
    carrierStatusCode: 'DP',
    carrierStatusDescription: 'Departed FedEx location',
    delivered: false,
    inTransit: true,
    exception: false,
    shipDate: '2026-09-10T07:00:00Z',
    estimatedDeliveryDate: '2026-09-14T00:00:00Z',
    actualDeliveryDate: null,
    exceptionDescription: null,
    events: [
      {
        occurredAt: '2026-09-11T14:02:00Z',
        carrierOccurredAt: '2026-09-11T09:02:00-05:00',
        status: 'in_transit',
        statusCode: 'IT',
        description: 'In Transit',
        detailDescription: 'In transit',
        carrierStatusCode: 'DP',
        carrierStatusDescription: 'Departed FedEx location',
        cityLocality: 'Memphis',
        stateProvince: 'TN',
        postalCode: '38118',
        countryCode: 'US',
        signer: null,
      },
    ],
    eventCount: 4,
    eventsTruncated: false,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: getShipstationTrackingExecute,
  // Not externally safe: a tracking number is not authorization to query an
  // account's carrier data. See src/tools/toolsets.ts.
  agent: { toolsetSlug: 'shipstation.read' },
})
