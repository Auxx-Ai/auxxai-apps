// src/tools/list-shipstation-shipments.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../assets/icon.png'
import { exampleShipmentSummary, shipmentSummarySchema } from './get-shipstation-shipment.tool'
import listShipstationShipmentsExecute from './list-shipstation-shipments.tool.server'

/** Shipments matching a filter, newest first, with explicit page metadata. */
export const listShipstationShipmentsTool = defineTool({
  id: 'list_shipstation_shipments',
  name: 'List ShipStation shipments',
  description:
    'List ShipStation shipments, newest created first. Filter by status, store, sales order, ' +
    'shipment number, recipient name, or a created/modified date window. Returns light-weight ' +
    'rows: use get_shipstation_shipment for addresses, boxes and line items, ' +
    'get_shipstation_shipment_packages for tracking numbers, and get_shipstation_tracking for ' +
    'where a parcel actually is. ' +
    'IMPORTANT: this is one page of results. Read hasMore before saying how many shipments ' +
    'exist or that a list is complete, and page through with the page input rather than ' +
    'reasoning over a truncated set.',
  icon: shipstationIcon,
  inputs: z.object({
    shipmentStatus: z
      .enum(['pending', 'processing', 'label_purchased', 'cancelled'])
      .optional()
      .describe('Restrict to one status. Omit to include every status.'),
    storeId: z.string().optional().describe('Restrict to one selling store, e.g. se-2943015.'),
    salesOrderId: z.string().optional().describe("The order source's sales order id."),
    shipmentNumber: z
      .string()
      .optional()
      .describe('The user or order-source defined shipment number, e.g. 14530.'),
    shipToName: z.string().optional().describe('Match on the recipient name.'),
    createdAtStart: z
      .string()
      .optional()
      .describe('ISO 8601 timestamp. Only shipments created at or after this.'),
    createdAtEnd: z
      .string()
      .optional()
      .describe('ISO 8601 timestamp. Only shipments created at or before this.'),
    modifiedAtStart: z
      .string()
      .optional()
      .describe('ISO 8601 timestamp. Only shipments changed at or after this.'),
    modifiedAtEnd: z
      .string()
      .optional()
      .describe('ISO 8601 timestamp. Only shipments changed at or before this.'),
    page: z.number().int().min(1).optional().describe('1-based page number. Defaults to 1.'),
    pageSize: z.number().int().min(1).max(100).optional().describe('Defaults to 20, max 100.'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe('Readable rollup of this page. Safe to quote directly when answering.'),
    shipments: z.array(shipmentSummarySchema),
    total: z
      .number()
      .nullable()
      .describe('Total shipments matching the filter, as reported upstream.'),
    page: z.number(),
    pageSize: z.number(),
    pages: z.number().nullable().describe('Total pages matching, as reported upstream.'),
    hasMore: z
      .boolean()
      .describe('True when more pages match. Say so rather than implying this page is everything.'),
  }),
  exampleOutput: {
    summary:
      '2 shipments on this page of 135 matching, covering 4 planned boxes. Statuses: ' +
      'label_purchased. More pages match this filter, so this is NOT the full set.',
    shipments: [exampleShipmentSummary],
    total: 135,
    page: 1,
    pageSize: 20,
    pages: 7,
    hasMore: true,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: listShipstationShipmentsExecute,
  // Not externally safe: browsing an account's shipments is not something a
  // tracking number entitles a caller to. See src/tools/toolsets.ts.
  agent: { toolsetSlug: 'shipstation.read' },
})
