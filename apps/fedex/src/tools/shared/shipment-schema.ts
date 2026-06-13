// src/tools/shared/shipment-schema.ts

/**
 * The normalized shipment shape returned by every FedEx tracking tool and
 * carried in the polling trigger's event payload. This is the cross-carrier
 * contract — the UPS app mirrors it so agents see one consistent shipment
 * shape regardless of carrier.
 *
 * `MappedShipment` is derived from `shipmentSchema` so the zod schema (used in
 * tool `outputs`) and the TypeScript type (used by the mapper) never drift.
 */

import { z } from '@auxx/sdk/tools'

/** Normalized status enum. FedEx surfaces `OD` distinctly, so we keep `out_for_delivery`. */
export const statusTypeEnum = z.enum([
  'label_created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'exception',
  'returned_to_shipper',
  'unknown',
])

export type ShipmentStatusType = z.infer<typeof statusTypeEnum>

export const scanEventSchema = z.object({
  date: z.string().nullable().describe('UTC ISO 8601 timestamp of the scan, or null.'),
  location: z
    .string()
    .nullable()
    .describe('City, state/province, country — null when not provided.'),
  description: z.string().describe('Human-readable scan description.'),
})

export type ScanEvent = z.infer<typeof scanEventSchema>

export const shipmentSchema = z.object({
  trackingNumber: z.string(),
  statusType: statusTypeEnum.describe('Normalized status — the field agents should branch on.'),
  statusCode: z.string().describe('Raw FedEx derivedCode (or code) — kept for debugging.'),
  statusDescription: z.string(),
  estimatedDelivery: z
    .string()
    .nullable()
    .describe('UTC ISO. The window start when FedEx returns a delivery window.'),
  estimatedDeliveryWindow: z
    .object({ begins: z.string(), ends: z.string() })
    .nullable()
    .describe('UTC ISO delivery window, when FedEx provides one.'),
  deliveredAt: z.string().nullable().describe('UTC ISO actual delivery time, or null.'),
  isDelayed: z.boolean().describe('True when any scan reports a DELAYED status.'),
  lastActivity: z
    .object({
      date: z.string().nullable(),
      location: z.string().nullable(),
      description: z.string(),
    })
    .nullable()
    .describe('The most recent scan event.'),
  service: z.string().nullable().describe('FedEx service description, e.g. "FedEx Ground".'),
  receivedByName: z.string().nullable().describe('Who signed for / received the package.'),
  scanEvents: z
    .array(scanEventSchema)
    .describe('Scan history, newest-first, capped at 20 for token economy.'),
})

export type MappedShipment = z.infer<typeof shipmentSchema>

/** Per-number result shape shared by `track_shipment` and `track_by_reference`. */
export const trackResultsSchema = z.object({
  results: z.array(
    z.object({
      trackingNumber: z.string(),
      found: z.boolean().describe('False when FedEx has no info for this number yet.'),
      shipment: shipmentSchema.nullable(),
    })
  ),
})

export type TrackResults = z.infer<typeof trackResultsSchema>
