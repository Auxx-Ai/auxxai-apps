// src/tools/shared/shipment-schema.ts

/**
 * The normalized shipment shape returned by every UPS tracking tool and carried
 * in the polling trigger's event payload. This is the cross-carrier contract —
 * it mirrors the FedEx app so agents see one consistent shipment shape
 * regardless of carrier. Capability fields diverge: UPS adds proof-of-delivery
 * and signature; FedEx adds reference lookups.
 *
 * `MappedShipment` is derived from `shipmentSchema` so the zod schema (used in
 * tool `outputs`) and the TypeScript type (used by the mapper) never drift.
 */

import { z } from '@auxx/sdk/tools'

/**
 * Normalized status enum — shared across carrier apps. UPS folds out-for-delivery
 * into `in_transit` (its data doesn't reliably distinguish it), so the mapper
 * emits a subset of this enum; it never invents new values.
 */
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
  statusCode: z.string().describe('Raw UPS status code (e.g. "SR") — kept for debugging.'),
  statusDescription: z.string(),
  estimatedDelivery: z
    .string()
    .nullable()
    .describe('Estimated delivery date (ISO, date-only when UPS gives no time), or null.'),
  estimatedDeliveryWindow: z
    .object({ begins: z.string(), ends: z.string() })
    .nullable()
    .describe('Delivery time window, when UPS provides one.'),
  deliveredAt: z.string().nullable().describe('UTC ISO actual delivery time, or null.'),
  lastActivity: z
    .object({
      date: z.string().nullable(),
      location: z.string().nullable(),
      description: z.string(),
    })
    .nullable()
    .describe('The most recent scan event.'),
  service: z.string().nullable().describe('UPS service description, e.g. "UPS Ground".'),
  weight: z.string().nullable().describe('Package weight with unit, e.g. "5 LBS".'),
  referenceNumbers: z
    .array(z.string())
    .describe('Shipper/shipment reference numbers attached to the package.'),
  scanEvents: z
    .array(scanEventSchema)
    .describe('Scan history, newest-first, capped at 20 for token economy.'),
  proofOfDelivery: z
    .string()
    .nullable()
    .describe('Proof-of-delivery content — only present when requested.'),
  signature: z
    .string()
    .nullable()
    .describe('Base64 signature image — only present when requested.'),
})

export type MappedShipment = z.infer<typeof shipmentSchema>

/** Per-number result shape returned by `track_shipment`. */
export const trackResultsSchema = z.object({
  results: z.array(
    z.object({
      trackingNumber: z.string(),
      found: z.boolean().describe('False when UPS has no info for this number yet.'),
      shipment: shipmentSchema.nullable(),
    })
  ),
})

export type TrackResults = z.infer<typeof trackResultsSchema>
