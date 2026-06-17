// src/tools/shared/block-io.ts

/**
 * I/O shapes for the internal block-dispatch tools (`ups_block_*`).
 *
 * The workflow block panel writes flat, scalar fields and downstream nodes bind
 * scalar outputs — so unlike the agent tools (which return a nested `results[]`
 * array), the block tools take a single tracking number and return a single
 * flattened shipment. {@link flattenShipment} is the one place that projection
 * lives, shared by every track-style block tool.
 *
 * UPS Tracking v1 has no reference lookup, so there is no `matchCount` (a
 * single-number lookup always matches 0 or 1) and no by-reference inputs — both
 * present in the FedEx block.
 */

import { z } from '@auxx/sdk/tools'
import { statusTypeEnum, type MappedShipment } from './shipment-schema'

// --- Inputs --------------------------------------------------------------

export const blockTrackInputs = z.object({
  trackingNumber: z.string().min(1).describe('UPS tracking number to look up.'),
  includeProofOfDelivery: z
    .boolean()
    .optional()
    .describe('Include proof-of-delivery content when available (default false).'),
  includeSignature: z
    .boolean()
    .optional()
    .describe('Include the signature image when available (default false).'),
})

export const blockWatchInputs = z.object({
  trackingNumber: z.string().min(1).describe('UPS tracking number to watch.'),
  recordId: z.string().optional().describe('Auxx record id to link the shipment to.'),
})

export const blockUnwatchInputs = z.object({
  trackingNumber: z.string().min(1).describe('UPS tracking number to stop watching.'),
})

// --- Outputs -------------------------------------------------------------

/** Flattened single-shipment output — every field a scalar for easy variable binding. */
export const flatShipmentOutputs = z.object({
  found: z.boolean(),
  trackingNumber: z.string(),
  statusType: statusTypeEnum,
  statusCode: z.string(),
  statusDescription: z.string(),
  estimatedDelivery: z.string(),
  deliveredAt: z.string(),
  isDelivered: z.boolean(),
  isException: z.boolean(),
  lastActivityDate: z.string(),
  lastActivityLocation: z.string(),
  lastActivityDescription: z.string(),
  service: z.string(),
  weight: z.string(),
  proofOfDelivery: z.string(),
  signature: z.string(),
})

export type FlatShipment = z.infer<typeof flatShipmentOutputs>

export const blockWatchOutputs = z.object({
  watched: z.boolean(),
  currentStatus: statusTypeEnum,
  expiresAt: z.string(),
})

export const blockUnwatchOutputs = z.object({
  removed: z.boolean(),
})

// --- Projection ----------------------------------------------------------

/** Empty (not-found) flattened shipment — nulls collapse to '' so bindings stay scalar. */
function emptyFlat(trackingNumber: string): FlatShipment {
  return {
    found: false,
    trackingNumber,
    statusType: 'unknown',
    statusCode: '',
    statusDescription: '',
    estimatedDelivery: '',
    deliveredAt: '',
    isDelivered: false,
    isException: false,
    lastActivityDate: '',
    lastActivityLocation: '',
    lastActivityDescription: '',
    service: '',
    weight: '',
    proofOfDelivery: '',
    signature: '',
  }
}

/**
 * Project a {@link MappedShipment} into the flat block-output shape. `null`/missing
 * values become empty strings so downstream nodes always bind a scalar.
 */
export function flattenShipment(
  trackingNumber: string,
  found: boolean,
  shipment: MappedShipment | null
): FlatShipment {
  if (!found || !shipment) return emptyFlat(trackingNumber)
  return {
    found: true,
    trackingNumber: shipment.trackingNumber,
    statusType: shipment.statusType,
    statusCode: shipment.statusCode,
    statusDescription: shipment.statusDescription,
    estimatedDelivery: shipment.estimatedDelivery ?? '',
    deliveredAt: shipment.deliveredAt ?? '',
    isDelivered: shipment.statusType === 'delivered',
    isException: shipment.statusType === 'exception',
    lastActivityDate: shipment.lastActivity?.date ?? '',
    lastActivityLocation: shipment.lastActivity?.location ?? '',
    lastActivityDescription: shipment.lastActivity?.description ?? '',
    service: shipment.service ?? '',
    weight: shipment.weight ?? '',
    proofOfDelivery: shipment.proofOfDelivery ?? '',
    signature: shipment.signature ?? '',
  }
}
