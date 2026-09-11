// src/blocks/shipstation/resources/rate/rate-schema.ts

/**
 * The `rate` resource: `estimate`, `getMany` and `getForShipment`.
 *
 * Three operations that all answer "what will this cost", at three different
 * levels of commitment:
 *
 * | Operation | Endpoint | What it needs | What it returns |
 * | --- | --- | --- | --- |
 * | `estimate` | `POST /v2/rates/estimate` | postal locality only | ballpark rates, NO `rateId` |
 * | `getMany` | `POST /v2/rates` | a full shipment payload | real rates, each with a `rateId` |
 * | `getForShipment` | `GET /v2/shipments/{id}/rates` | a shipment that already exists | the rates already calculated for it |
 *
 * 🛑 The difference that matters: `estimate` answers with ShipStation's
 * `rate-estimate` schema, which has NO `rate_id`. An estimate cannot be bought.
 * Only `getMany` and `getForShipment` produce a `rateId` that
 * `POST /v2/labels/rates/{rate_id}` (the block's `label.create` in `rate` mode)
 * can spend. The `rateId` output is declared on all three anyway so the shape
 * stays stable, and it is documented as empty on an estimate rather than
 * quietly absent.
 *
 * Input keys follow the block convention `<resource><Operation><Field>`.
 */

import { Workflow } from '@auxx/sdk'
import { shipFromMode, shippingAddress, shippingPhone } from '../../shared/address-schema'
import { DIMENSION_UNITS, WEIGHT_UNITS, packagesArray } from '../../shared/packages-schema'

/**
 * ShipStation's `confirmation` enum, in full.
 *
 * Offering a subset would silently hide a carrier's delivery options from an
 * author, so every documented value is here even though most accounts use the
 * first four.
 */
const CONFIRMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'delivery', label: 'Delivery confirmation' },
  { value: 'signature', label: 'Signature' },
  { value: 'adult_signature', label: 'Adult signature' },
  { value: 'adult_signature_restricted_delivery', label: 'Adult signature, restricted delivery' },
  { value: 'direct_signature', label: 'Direct signature' },
  { value: 'delivery_mailed', label: 'Delivery, mailed' },
  { value: 'verbal_confirmation', label: 'Verbal confirmation' },
  { value: 'delivery_code', label: 'Delivery code' },
  { value: 'age_verification_16_plus', label: 'Age verification (16+)' },
] as const

/** `unknown | yes | no`. `unknown` is a real state and ShipStation's own default. */
const RESIDENTIAL_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'yes', label: 'Residential' },
  { value: 'no', label: 'Commercial' },
] as const

/**
 * The locality fields `POST /v2/rates/estimate` actually requires.
 *
 * Its schema requires country, postal code, city AND state on both ends, but
 * nothing else: no street, no name, no phone. So this is a `Workflow.address()`
 * narrowed to exactly those components rather than either a full shipping
 * address (which would demand a street and a phone the endpoint never reads) or
 * eight loose string inputs (which would cost eight bindings instead of one).
 */
const ESTIMATE_ADDRESS_COMPONENTS = ['city', 'state', 'zipCode', 'country'] as const

/** The same, plus the residential indicator the estimate body carries separately. */
const ESTIMATE_DESTINATION_COMPONENTS = [
  'city',
  'state',
  'zipCode',
  'country',
  'residential',
] as const

export const rateInputs = {
  // --- Rate: Estimate ---
  rateEstimateShipFrom: Workflow.address({
    label: 'Ship from',
    description: 'Only the city, state, postal code and country are used.',
    acceptsVariables: true,
    addressComponents: ESTIMATE_ADDRESS_COMPONENTS,
  }),
  rateEstimateShipTo: Workflow.address({
    label: 'Ship to',
    description: 'Only the city, state, postal code and country are used.',
    acceptsVariables: true,
    addressComponents: ESTIMATE_DESTINATION_COMPONENTS,
  }),
  rateEstimateCarrierIds: Workflow.select({
    label: 'Carriers',
    description: 'Leave empty to estimate across every connected carrier.',
    options: [] as { value: string; label: string }[],
    multi: true,
  }),
  rateEstimateWeightValue: Workflow.number({ label: 'Weight', acceptsVariables: true }),
  rateEstimateWeightUnit: Workflow.select({
    label: 'Weight unit',
    options: [...WEIGHT_UNITS],
    default: 'ounce',
  }),
  rateEstimateLength: Workflow.number({ label: 'Length', acceptsVariables: true }),
  rateEstimateWidth: Workflow.number({ label: 'Width', acceptsVariables: true }),
  rateEstimateHeight: Workflow.number({ label: 'Height', acceptsVariables: true }),
  rateEstimateDimensionUnit: Workflow.select({
    label: 'Dimension unit',
    options: [...DIMENSION_UNITS],
    default: 'inch',
  }),
  rateEstimateConfirmation: Workflow.select({
    label: 'Confirmation',
    options: [...CONFIRMATION_OPTIONS],
    default: 'none',
  }),
  rateEstimateResidential: Workflow.select({
    label: 'Destination type',
    description: 'Overrides the indicator on the Ship to address. Drives a carrier surcharge.',
    options: [...RESIDENTIAL_OPTIONS],
    default: 'unknown',
  }),
  rateEstimateShipDate: Workflow.date({
    label: 'Ship date',
    description: 'Required by ShipStation. Defaults to today when left empty.',
    acceptsVariables: true,
  }),

  // --- Rate: Get Many (the full rate shop) ---
  rateGetManyCarrierIds: Workflow.select({
    label: 'Carriers',
    description: 'At least one. ShipStation requires the carrier set on a rate shop.',
    options: [] as { value: string; label: string }[],
    multi: true,
    required: true,
  }),
  rateGetManyServiceCodes: Workflow.string({
    label: 'Service codes',
    description:
      'Optional, comma separated, e.g. usps_priority_mail, ups_ground. Leave empty to shop every service the carriers offer.',
    acceptsVariables: true,
  }),
  rateGetManyPackageTypes: Workflow.string({
    label: 'Package types',
    description: 'Optional, comma separated carrier package codes.',
    acceptsVariables: true,
  }),
  rateGetManyPreferredCurrency: Workflow.string({
    label: 'Preferred currency',
    description: 'Optional ISO currency code, e.g. usd.',
    acceptsVariables: true,
  }),
  rateGetManyCalculateTaxAmount: Workflow.boolean({
    label: 'Calculate tax',
    description: 'Ask the carrier for duties and taxes on an international shipment.',
    default: false,
  }),
  rateGetManyIsReturn: Workflow.boolean({
    label: 'Return shipment',
    description: 'Rate this as a return, which reverses the origin and destination.',
    default: false,
  }),
  rateGetManyShipTo: shippingAddress({ label: 'Ship to' }),
  rateGetManyShipToPhone: shippingPhone({ label: 'Ship to phone' }),
  rateGetManyShipFromMode: shipFromMode,
  rateGetManyWarehouseId: Workflow.select({
    label: 'Warehouse',
    options: [] as { value: string; label: string }[],
    acceptsVariables: true,
  }),
  rateGetManyShipFrom: shippingAddress({ label: 'Ship from' }),
  rateGetManyShipFromPhone: shippingPhone({ label: 'Ship from phone' }),
  rateGetManyPackages: packagesArray({
    label: 'Packages',
    description: 'One row per box. Only the weight is required.',
  }),
  rateGetManyConfirmation: Workflow.select({
    label: 'Confirmation',
    options: [...CONFIRMATION_OPTIONS],
    default: 'none',
  }),
  rateGetManyShipDate: Workflow.date({
    label: 'Ship date',
    description: 'Optional. ShipStation rates for today when left empty.',
    acceptsVariables: true,
  }),

  // --- Rate: Get Rates for Shipment ---
  rateGetForShipmentShipmentId: Workflow.string({
    label: 'Shipment ID',
    description: 'A ShipStation shipment id, e.g. se-1234567.',
    acceptsVariables: true,
    required: true,
  }),
  rateGetForShipmentCreatedAtStart: Workflow.datetime({
    label: 'Calculated after',
    description: 'Optional. Only return rates calculated after this moment.',
    acceptsVariables: true,
  }),
}

/**
 * One rate.
 *
 * Every money field is an integer number of minor units (cents), which is what
 * the platform's `currency` type carries; `currency` holds the code they are
 * denominated in. `totalAmount` is the sum ShipStation's own field descriptions
 * define as the purchase price: shipping + insurance + confirmation + other.
 * Tax is excluded from it deliberately, because ShipStation excludes it too.
 */
const rateFields = {
  rateId: Workflow.string(),
  rateType: Workflow.string(),
  carrierId: Workflow.string(),
  carrierCode: Workflow.string(),
  carrierFriendlyName: Workflow.string(),
  carrierNickname: Workflow.string(),
  serviceCode: Workflow.string(),
  serviceType: Workflow.string(),
  packageType: Workflow.string(),
  currency: Workflow.string(),
  totalAmount: Workflow.currency(),
  shippingAmount: Workflow.currency(),
  insuranceAmount: Workflow.currency(),
  confirmationAmount: Workflow.currency(),
  otherAmount: Workflow.currency(),
  taxAmount: Workflow.currency(),
  deliveryDays: Workflow.number({ integer: true }),
  carrierDeliveryDays: Workflow.string(),
  estimatedDeliveryDate: Workflow.datetime(),
  shipDate: Workflow.datetime(),
  guaranteedService: Workflow.boolean(),
  negotiatedRate: Workflow.boolean(),
  trackable: Workflow.boolean(),
  zone: Workflow.number({ integer: true }),
  validationStatus: Workflow.string(),
  warningMessages: Workflow.array({ items: Workflow.string() }),
  errorMessages: Workflow.array({ items: Workflow.string() }),
}

function rateListOutputs(label: string) {
  return {
    rates: Workflow.array({
      label: 'rates',
      items: Workflow.struct(rateFields, { label: 'rate' }),
    }),
    count: Workflow.number({ label: 'count', integer: true }),
    cheapest: Workflow.struct(rateFields, { label: `cheapest ${label}` }),
  }
}

/** The variables a rate operation publishes downstream. */
export function rateComputeOutputs(operation: string) {
  if (operation === 'estimate') {
    return rateListOutputs('estimate')
  }
  if (operation === 'getMany' || operation === 'getForShipment') {
    return {
      ...rateListOutputs('rate'),
      invalidRates: Workflow.array({
        label: 'invalidRates',
        items: Workflow.struct(rateFields, { label: 'rate' }),
      }),
      rateRequestId: Workflow.string({ label: 'rateRequestId' }),
      shipmentId: Workflow.string({ label: 'shipmentId' }),
      status: Workflow.string({ label: 'status' }),
      errors: Workflow.array({ label: 'errors', items: Workflow.string() }),
    }
  }
  return {}
}
