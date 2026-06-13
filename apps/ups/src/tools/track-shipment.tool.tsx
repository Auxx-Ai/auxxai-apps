// src/tools/track-shipment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import { trackResultsSchema } from './shared/shipment-schema'
import trackShipmentExecute from './track-shipment.tool.server'

export const trackShipmentTool = defineTool({
  id: 'track_shipment',
  name: 'Track UPS shipment',
  description:
    'Look up live UPS tracking status and scan history by tracking number. Pass several numbers at once when the customer has multiple shipments — one call handles up to 30. Returns per-number results; `found: false` means UPS has no info for that number yet. Set includeProofOfDelivery / includeSignature only when the customer needs delivery proof — they bloat the response.',
  icon,
  inputs: z.object({
    trackingNumbers: z
      .array(z.string().min(1))
      .min(1)
      .max(30)
      .describe('UPS tracking numbers (1–30, usually starting 1Z). Batch multiple in one call.'),
    includeProofOfDelivery: z
      .boolean()
      .optional()
      .describe('Include proof-of-delivery content when available (default false).'),
    includeSignature: z
      .boolean()
      .optional()
      .describe('Include the signature image when available (default false).'),
  }),
  outputs: trackResultsSchema,
  exampleOutput: {
    results: [
      {
        trackingNumber: '1Z023E2X0214323462',
        found: true,
        shipment: {
          trackingNumber: '1Z023E2X0214323462',
          statusType: 'in_transit',
          statusCode: 'OR',
          statusDescription: 'Origin Scan',
          estimatedDelivery: '2026-06-14',
          estimatedDeliveryWindow: null,
          deliveredAt: null,
          lastActivity: {
            date: '2026-06-12T12:13:56Z',
            location: 'Wayne, NJ, US',
            description: 'Origin Scan',
          },
          service: 'UPS Ground',
          weight: '5 LBS',
          referenceNumbers: ['ShipRef123'],
          scanEvents: [
            {
              date: '2026-06-12T12:13:56Z',
              location: 'Wayne, NJ, US',
              description: 'Origin Scan',
            },
          ],
          proofOfDelivery: null,
          signature: null,
        },
      },
      {
        trackingNumber: '1Z023E2X0214323463',
        found: true,
        shipment: {
          trackingNumber: '1Z023E2X0214323463',
          statusType: 'delivered',
          statusCode: 'FS',
          statusDescription: 'Delivered',
          estimatedDelivery: '2026-06-11',
          estimatedDeliveryWindow: null,
          deliveredAt: '2026-06-11T19:32:00Z',
          lastActivity: {
            date: '2026-06-11T19:32:00Z',
            location: 'San Francisco, CA, US',
            description: 'Delivered',
          },
          service: 'UPS Next Day Air',
          weight: '2 LBS',
          referenceNumbers: [],
          scanEvents: [
            {
              date: '2026-06-11T19:32:00Z',
              location: 'San Francisco, CA, US',
              description: 'Delivered',
            },
          ],
          proofOfDelivery: null,
          signature: null,
        },
      },
    ],
  },
  config: { requiresConnection: true, idempotent: true, timeout: 15000 },
  execute: trackShipmentExecute,
  agent: { toolsetSlug: 'ups.tracking', idempotent: true },
})
