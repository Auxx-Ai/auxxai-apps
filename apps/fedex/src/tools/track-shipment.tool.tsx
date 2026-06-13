// src/tools/track-shipment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import { trackResultsSchema } from './shared/shipment-schema'
import trackShipmentExecute from './track-shipment.tool.server'

export const trackShipmentTool = defineTool({
  id: 'track_shipment',
  name: 'Track FedEx shipment',
  description:
    'Look up live FedEx tracking status and scan history by tracking number. Pass several numbers at once when the customer has multiple shipments — one batched call handles up to 30. Returns per-number results; `found: false` means FedEx has no info for that number yet.',
  icon,
  inputs: z.object({
    trackingNumbers: z
      .array(z.string().min(1))
      .min(1)
      .max(30)
      .describe('FedEx tracking numbers (1–30). Batch multiple in one call.'),
    shipDateBegin: z
      .string()
      .optional()
      .describe('Optional ISO date (YYYY-MM-DD) — disambiguates reused tracking numbers.'),
    shipDateEnd: z
      .string()
      .optional()
      .describe('Optional ISO date (YYYY-MM-DD) — disambiguates reused tracking numbers.'),
  }),
  outputs: trackResultsSchema,
  exampleOutput: {
    results: [
      {
        trackingNumber: '123456789012',
        found: true,
        shipment: {
          trackingNumber: '123456789012',
          statusType: 'in_transit',
          statusCode: 'IT',
          statusDescription: 'In transit',
          estimatedDelivery: '2026-06-14T20:00:00Z',
          estimatedDeliveryWindow: null,
          deliveredAt: null,
          isDelayed: false,
          lastActivity: {
            date: '2026-06-12T09:14:00Z',
            location: 'Memphis, TN, US',
            description: 'Departed FedEx hub',
          },
          service: 'FedEx Ground',
          receivedByName: null,
          scanEvents: [
            {
              date: '2026-06-12T09:14:00Z',
              location: 'Memphis, TN, US',
              description: 'Departed FedEx hub',
            },
            {
              date: '2026-06-11T22:02:00Z',
              location: 'Memphis, TN, US',
              description: 'Arrived at FedEx hub',
            },
          ],
        },
      },
      {
        trackingNumber: '999888777666',
        found: true,
        shipment: {
          trackingNumber: '999888777666',
          statusType: 'delivered',
          statusCode: 'DL',
          statusDescription: 'Delivered',
          estimatedDelivery: '2026-06-11T20:00:00Z',
          estimatedDeliveryWindow: null,
          deliveredAt: '2026-06-11T19:32:00Z',
          isDelayed: false,
          lastActivity: {
            date: '2026-06-11T19:32:00Z',
            location: 'San Francisco, CA, US',
            description: 'Delivered',
          },
          service: 'FedEx Express',
          receivedByName: 'J.COOPER',
          scanEvents: [
            {
              date: '2026-06-11T19:32:00Z',
              location: 'San Francisco, CA, US',
              description: 'Delivered',
            },
          ],
        },
      },
    ],
  },
  config: { requiresConnection: true, idempotent: true, timeout: 10000 },
  execute: trackShipmentExecute,
  agent: { toolsetSlug: 'fedex.tracking', idempotent: true },
})
