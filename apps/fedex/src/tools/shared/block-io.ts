// src/tools/shared/block-io.ts

/**
 * I/O shapes for the internal block-dispatch tools (`fedex_block_*`).
 *
 * The workflow block panel writes flat, scalar fields and downstream nodes bind
 * scalar outputs — so unlike the agent tools (which return a nested `results[]`
 * array), the block tools take a single tracking number / reference and return a
 * single flattened shipment. {@link flattenShipment} is the one place that
 * projection lives, shared by every track-style block tool.
 */

import { z } from '@auxx/sdk/tools'
import { statusTypeEnum, type MappedShipment } from './shipment-schema'

const REFERENCE_TYPES = [
  'CUSTOMER_REFERENCE',
  'PURCHASE_ORDER',
  'INVOICE',
  'BILL_OF_LADING',
  'PART_NUMBER',
] as const

// --- Inputs --------------------------------------------------------------

export const blockTrackInputs = z.object({
  trackingNumber: z.string().min(1).describe('FedEx tracking number to look up.'),
  shipDateBegin: z.string().optional().describe('Optional ISO date (YYYY-MM-DD).'),
  shipDateEnd: z.string().optional().describe('Optional ISO date (YYYY-MM-DD).'),
})

export const blockTrackByReferenceInputs = z.object({
  reference: z.string().min(1).describe('Reference value to search for, e.g. an order number.'),
  referenceType: z.enum(REFERENCE_TYPES).default('CUSTOMER_REFERENCE'),
  shipDateBegin: z
    .string()
    .optional()
    .describe('Optional ISO date (YYYY-MM-DD). Defaults to 30 days ago.'),
  shipDateEnd: z.string().optional().describe('Optional ISO date (YYYY-MM-DD). Defaults to today.'),
})

export const blockWatchInputs = z.object({
  trackingNumber: z.string().min(1).describe('FedEx tracking number to watch.'),
  recordId: z.string().optional().describe('Auxx record id to link the shipment to.'),
})

export const blockUnwatchInputs = z.object({
  trackingNumber: z.string().min(1).describe('FedEx tracking number to stop watching.'),
})

// --- Outputs -------------------------------------------------------------

/** Flattened single-shipment output — every field a scalar for easy variable binding. */
export const flatShipmentOutputs = z.object({
  found: z.boolean(),
  trackingNumber: z.string(),
  matchCount: z
    .number()
    .describe('Shipments the lookup matched (reference lookups can match several).'),
  statusType: statusTypeEnum,
  statusCode: z.string(),
  statusDescription: z.string(),
  estimatedDelivery: z.string(),
  deliveredAt: z.string(),
  isDelivered: z.boolean(),
  isException: z.boolean(),
  isDelayed: z.boolean(),
  lastActivityDate: z.string(),
  lastActivityLocation: z.string(),
  lastActivityDescription: z.string(),
  service: z.string(),
  receivedByName: z.string(),
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
function emptyFlat(trackingNumber: string, matchCount: number): FlatShipment {
  return {
    found: false,
    trackingNumber,
    matchCount,
    statusType: 'unknown',
    statusCode: '',
    statusDescription: '',
    estimatedDelivery: '',
    deliveredAt: '',
    isDelivered: false,
    isException: false,
    isDelayed: false,
    lastActivityDate: '',
    lastActivityLocation: '',
    lastActivityDescription: '',
    service: '',
    receivedByName: '',
  }
}

/**
 * Project a {@link MappedShipment} into the flat block-output shape. `null`/missing
 * values become empty strings so downstream nodes always bind a scalar.
 */
export function flattenShipment(
  trackingNumber: string,
  found: boolean,
  shipment: MappedShipment | null,
  matchCount: number
): FlatShipment {
  if (!found || !shipment) return emptyFlat(trackingNumber, matchCount)
  return {
    found: true,
    trackingNumber: shipment.trackingNumber,
    matchCount,
    statusType: shipment.statusType,
    statusCode: shipment.statusCode,
    statusDescription: shipment.statusDescription,
    estimatedDelivery: shipment.estimatedDelivery ?? '',
    deliveredAt: shipment.deliveredAt ?? '',
    isDelivered: shipment.statusType === 'delivered',
    isException: shipment.statusType === 'exception',
    isDelayed: shipment.isDelayed,
    lastActivityDate: shipment.lastActivity?.date ?? '',
    lastActivityLocation: shipment.lastActivity?.location ?? '',
    lastActivityDescription: shipment.lastActivity?.description ?? '',
    service: shipment.service ?? '',
    receivedByName: shipment.receivedByName ?? '',
  }
}
