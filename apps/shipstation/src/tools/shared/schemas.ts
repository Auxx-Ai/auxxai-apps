// src/tools/shared/schemas.ts

/** Shared zod shapes for the projected ShipStation label/package output. */

import { z } from '@auxx/sdk/tools'

export const packageSchema = z.object({
  packageId: z
    .string()
    .describe('Label-scoped package id. Stable within this label; not a global package id.'),
  sequence: z
    .number()
    .nullable()
    .describe('Box number as printed by the carrier. Order display by this, never by array order.'),
  trackingNumber: z.string().nullable().describe('Tracking number for this individual box.'),
  isMaster: z
    .boolean()
    .describe("True when this box's tracking number is also the label's master number."),
  weight: z.object({ value: z.number(), unit: z.string() }).nullable(),
  dimensions: z
    .object({ length: z.number(), width: z.number(), height: z.number(), unit: z.string() })
    .nullable(),
})

export const labelSchema = z.object({
  labelId: z.string(),
  shipmentId: z.string().nullable(),
  externalOrderId: z
    .string()
    .nullable()
    .describe(
      'Raw upstream id as ShipStation reports it. Its commerce meaning is unverified — do not treat it as a Shopify order or fulfillment id.'
    ),
  carrierCode: z.string().nullable(),
  serviceCode: z.string().nullable(),
  masterTrackingNumber: z
    .string()
    .nullable()
    .describe('The label-level tracking number. On a multi-box label it equals one of the boxes.'),
  labelStatus: z
    .string()
    .nullable()
    .describe(
      'Provider label status. Observed null on live list and get responses — read `voided` and `trackingStatus` for lifecycle, not this.'
    ),
  trackingStatus: z
    .string()
    .nullable()
    .describe(
      'Label-level carrier status. Applies to the label as a whole, NOT to each box, and can disagree with a live carrier lookup.'
    ),
  voided: z.boolean(),
  voidedAt: z.string().nullable(),
  isReturnLabel: z.boolean(),
  createdAt: z.string().nullable(),
  shipDate: z.string().nullable(),
  packageCount: z.number(),
  packages: z.array(packageSchema).describe('Every box on this label, ordered by sequence.'),
})

/** A worked three-box example taken from the live probe (tracking numbers redacted). */
export const exampleLabel = {
  labelId: 'se-197559213',
  shipmentId: 'se-428778294',
  externalOrderId: '17954843328688',
  carrierCode: 'fedex',
  serviceCode: 'fedex_home_delivery',
  masterTrackingNumber: '770000000003',
  labelStatus: null,
  trackingStatus: 'in_transit',
  voided: false,
  voidedAt: null,
  isReturnLabel: false,
  createdAt: '2026-09-10T07:00:00.000Z',
  shipDate: '2026-09-10T07:00:00Z',
  packageCount: 3,
  packages: [
    {
      packageId: '158414020',
      sequence: 1,
      trackingNumber: '770000000003',
      isMaster: true,
      weight: { value: 1280, unit: 'ounce' },
      dimensions: { length: 71, width: 6, height: 13, unit: 'inch' },
    },
    {
      packageId: '158414019',
      sequence: 2,
      trackingNumber: '770000000002',
      isMaster: false,
      weight: { value: 464, unit: 'ounce' },
      dimensions: { length: 96, width: 4, height: 4, unit: 'inch' },
    },
    {
      packageId: '158414018',
      sequence: 3,
      trackingNumber: '770000000001',
      isMaster: false,
      weight: { value: 704, unit: 'ounce' },
      dimensions: { length: 26, width: 50, height: 4, unit: 'inch' },
    },
  ],
}

/**
 * List-shaped label. Same scalars as `labelSchema`, but each box contributes only
 * its tracking number — weights and dimensions belong to the detail tools.
 */
export const labelSummarySchema = labelSchema.omit({ packages: true }).extend({
  trackingNumbers: z
    .array(z.string())
    .describe('Every box on this label, ordered by sequence. First entry is the master.'),
})

export const exampleLabelSummary = {
  ...(({ packages, ...rest }) => rest)(exampleLabel),
  trackingNumbers: ['770000000003', '770000000002', '770000000001'],
}
