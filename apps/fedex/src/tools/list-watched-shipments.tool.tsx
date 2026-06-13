// src/tools/list-watched-shipments.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import listWatchedShipmentsExecute from './list-watched-shipments.tool.server'

export const listWatchedShipmentsTool = defineTool({
  id: 'list_watched_shipments',
  name: 'List watched FedEx shipments',
  description:
    'List every FedEx shipment currently being watched for status changes on this connection, with each one’s last known status and linked ticket.',
  icon,
  inputs: z.object({}),
  outputs: z.object({
    count: z.number().int(),
    shipments: z.array(
      z.object({
        trackingNumber: z.string(),
        recordId: refs
          .entity('ticket')
          .nullable()
          .describe(
            'Auxx ticket record id linked to this shipment, or null. Use this id in `auxx:entity-card` fences.'
          ),
        lastKnownStatus: z.string(),
        watchedAt: z.string().describe('UTC ISO.'),
        expiresAt: z.string().describe('UTC ISO.'),
      })
    ),
  }),
  exampleOutput: {
    count: 1,
    shipments: [
      {
        trackingNumber: '123456789012',
        // refs.entity('ticket') marker — null or a sample RecordId both validate.
        recordId: 'tkt_01HZX',
        lastKnownStatus: 'in_transit',
        watchedAt: '2026-06-12T09:14:00Z',
        expiresAt: '2026-07-12T09:14:00Z',
      },
    ],
  },
  config: { requiresConnection: true, idempotent: true, timeout: 5000 },
  execute: listWatchedShipmentsExecute,
  agent: { toolsetSlug: 'fedex.tracking', idempotent: true },
})
