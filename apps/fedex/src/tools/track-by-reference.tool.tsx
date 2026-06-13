// src/tools/track-by-reference.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import { trackResultsSchema } from './shared/shipment-schema'
import trackByReferenceExecute from './track-by-reference.tool.server'

export const trackByReferenceTool = defineTool({
  id: 'track_by_reference',
  name: 'Track FedEx shipment by reference',
  description:
    "Look up FedEx shipments by your own reference (order number, PO, invoice, etc.) instead of the FedEx tracking number. Uses the connected account's FedEx account number. A reference can match multiple shipments. Returns the same per-number shape as track_shipment.",
  icon,
  inputs: z.object({
    reference: z
      .string()
      .min(1)
      .describe('The reference value to search for, e.g. an order number.'),
    referenceType: z
      .enum(['CUSTOMER_REFERENCE', 'PURCHASE_ORDER', 'INVOICE', 'BILL_OF_LADING', 'PART_NUMBER'])
      .default('CUSTOMER_REFERENCE')
      .describe('Which reference field to match. Defaults to CUSTOMER_REFERENCE.'),
    shipDateBegin: z
      .string()
      .optional()
      .describe('Optional ISO date (YYYY-MM-DD). Defaults to 30 days ago.'),
    shipDateEnd: z
      .string()
      .optional()
      .describe('Optional ISO date (YYYY-MM-DD). Defaults to today.'),
  }),
  outputs: trackResultsSchema,
  exampleOutput: {
    results: [
      {
        trackingNumber: '123456789012',
        found: true,
        shipment: {
          trackingNumber: '123456789012',
          statusType: 'out_for_delivery',
          statusCode: 'OD',
          statusDescription: 'Out for delivery',
          estimatedDelivery: '2026-06-12T20:00:00Z',
          estimatedDeliveryWindow: { begins: '2026-06-12T16:00:00Z', ends: '2026-06-12T20:00:00Z' },
          deliveredAt: null,
          isDelayed: false,
          lastActivity: {
            date: '2026-06-12T07:45:00Z',
            location: 'Oakland, CA, US',
            description: 'On FedEx vehicle for delivery',
          },
          service: 'FedEx Home Delivery',
          receivedByName: null,
          scanEvents: [
            {
              date: '2026-06-12T07:45:00Z',
              location: 'Oakland, CA, US',
              description: 'On FedEx vehicle for delivery',
            },
          ],
        },
      },
    ],
  },
  config: { requiresConnection: true, idempotent: true, timeout: 10000 },
  execute: trackByReferenceExecute,
  agent: { toolsetSlug: 'fedex.tracking', idempotent: true },
})
