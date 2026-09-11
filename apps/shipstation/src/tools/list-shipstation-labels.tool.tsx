// src/tools/list-shipstation-labels.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../assets/icon.png'
import listShipstationLabelsExecute from './list-shipstation-labels.tool.server'
import { exampleLabelSummary, labelSummarySchema } from './shared/schemas'

export const listShipstationLabelsTool = defineTool({
  id: 'list_shipstation_labels',
  name: 'List ShipStation labels',
  description:
    'List ShipStation labels, newest first, with every tracking number on each. Returns ' +
    'light-weight rows: use get_shipstation_label or get_shipstation_shipment_packages for ' +
    'per-box weights and dimensions. When answering, list the tracking numbers individually — ' +
    'a multi-box label has a different number per box and the customer needs all of them. ' +
    'IMPORTANT: the trackingNumber filter matches a label by its MASTER tracking number only; ' +
    'searching a non-master box number returns nothing. To find one shipment, use ' +
    'get_shipstation_shipment_packages instead.',
  icon: shipstationIcon,
  inputs: z.object({
    shipmentId: z
      .string()
      .optional()
      .describe('Return every label for this shipment, including voided ones.'),
    trackingNumber: z
      .string()
      .optional()
      .describe(
        'Match a label by its MASTER tracking number. Non-master box numbers will not match.'
      ),
    carrierId: z.string().optional().describe('Restrict to one carrier account, e.g. se-3891373.'),
    labelStatus: z
      .string()
      .optional()
      .describe("Provider label status filter, e.g. 'voided'. Omit to include every status."),
    page: z.number().int().min(1).optional().describe('1-based page number. Defaults to 1.'),
    pageSize: z.number().int().min(1).max(100).optional().describe('Defaults to 20, max 100.'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe('Readable rollup of this page. Safe to quote directly when answering.'),
    labels: z.array(labelSummarySchema),
    total: z
      .number()
      .nullable()
      .describe('Total labels matching the filter, as reported upstream.'),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z
      .boolean()
      .describe('True when more pages match. Say so rather than implying this is everything.'),
  }),
  exampleOutput: {
    summary:
      '3 labels on this page of 4290 matching. 1 multi-box (3 boxes), 0 voided. Carriers: fedex.',
    labels: [exampleLabelSummary],
    total: 4290,
    page: 1,
    pageSize: 20,
    hasMore: true,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: listShipstationLabelsExecute,
  agent: { toolsetSlug: 'shipstation.read' },
})
