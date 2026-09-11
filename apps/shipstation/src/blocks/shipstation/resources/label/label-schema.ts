// src/blocks/shipstation/resources/label/label-schema.ts

/**
 * The `label` resource of the ShipStation block: six operations over
 * `/v2/labels`.
 *
 * ## Input keys
 *
 * Seven resources share ONE flat `inputs` namespace, so every key here is
 * `label<Operation><Field>` (`labelGetId`, `labelCreateFrom`, `labelVoidId`).
 * A bare `getId` would collide with six other resources.
 *
 * ## Why `create` is one operation and not five
 *
 * ShipStation has five label-purchase endpoints. Three of them are the same
 * decision seen from different angles, so they collapse into one operation with
 * a `labelCreateFrom` mode select:
 *
 * | mode | endpoint | what the author supplies |
 * | --- | --- | --- |
 * | `shipment` | `POST /v2/labels/shipment/{id}` | a shipment id |
 * | `rate` | `POST /v2/labels/rates/{id}` | a rate id |
 * | `scratch` | `POST /v2/labels` | the whole shipment payload |
 *
 * The address and package inputs render only in `scratch` mode, which is what
 * keeps the common case (buy the label for the shipment a previous node made) a
 * one-field panel. The rate-shopper and shipping-rule purchase endpoints are
 * deliberately out of scope; see the plan §6.
 *
 * ## Two output facts this file encodes
 *
 * 1. **`track` is MASTER tracking only.** `GET /v2/labels/{id}/track` answers
 *    for the label's own tracking number, which is the box with `sequence: 1`.
 *    The live probe (build plan §9) found it disagreeing with the label's
 *    `tracking_status` and reading `in_transit` on a VOIDED label, so it is
 *    named and described as master tracking everywhere it appears. Per-box
 *    carrier status is the separate `tracking` resource.
 * 2. **A label carries N tracking numbers, not one plus children.** `get` and
 *    `getMany` return every package, ordered by `sequence`, with the master
 *    flagged by equality against the label's own tracking number. In the
 *    probe's three-box label the master was returned LAST, so array position is
 *    never identity.
 */

import { Workflow } from '@auxx/sdk'
import { shipFromMode, shippingAddress, shippingPhone } from '../../shared/address-schema'
import { packagesArray } from '../../shared/packages-schema'

/** `label_status`, plus an "any" choice for the list filter. */
const LABEL_STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'error', label: 'Error' },
  { value: 'voided', label: 'Voided' },
] as const

/** `GET /v2/labels?sort_by`. Only these three are accepted. */
const LABEL_SORT_BY_OPTIONS = [
  { value: 'created_at', label: 'Created at' },
  { value: 'modified_at', label: 'Modified at' },
  { value: 'voided_at', label: 'Voided at' },
] as const

const SORT_DIR_OPTIONS = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
] as const

/** `delivery_confirmation`. */
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
  { value: 'age_verification_16_plus', label: 'Age verification, 16+' },
] as const

/** `insurance_provider`. */
const INSURANCE_OPTIONS = [
  { value: 'none', label: 'No insurance' },
  { value: 'shipsurance', label: 'Shipsurance' },
  { value: 'parcelguard', label: 'ParcelGuard' },
  { value: 'xcover', label: 'XCover' },
  { value: 'carrier', label: 'The carrier' },
  { value: 'third_party', label: 'Third party' },
] as const

/** `validate_address`. */
const VALIDATE_ADDRESS_OPTIONS = [
  { value: 'no_validation', label: 'Do not validate' },
  { value: 'validate_only', label: 'Validate, fail on error' },
  { value: 'validate_and_clean', label: 'Validate and clean' },
] as const

/** `label_format`. */
const LABEL_FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'png', label: 'PNG' },
  { value: 'zpl', label: 'ZPL' },
] as const

/** `label_layout`. */
const LABEL_LAYOUT_OPTIONS = [
  { value: '4x6', label: '4x6 label' },
  { value: 'letter', label: 'Letter' },
] as const

/** How `label.get` identifies the label. Two endpoints, one operation. */
const GET_ID_KIND_OPTIONS = [
  { value: 'labelId', label: 'ShipStation label id' },
  { value: 'externalShipmentId', label: 'External shipment id' },
] as const

/** The three purchase modes `label.create` collapses. */
const CREATE_FROM_OPTIONS = [
  { value: 'shipment', label: 'An existing shipment' },
  { value: 'rate', label: 'A quoted rate' },
  { value: 'scratch', label: 'A new shipment (from scratch)' },
] as const

/**
 * Every `label` input, flat and operation-prefixed.
 *
 * Merged into the block's single `inputs` object by `shipstation-schema.ts`.
 */
export const labelInputs = {
  // --- label.getMany: GET /v2/labels ---
  labelGetManyStatus: Workflow.select({
    label: 'Label status',
    options: LABEL_STATUS_OPTIONS,
    default: '',
  }),
  labelGetManyCarrierId: Workflow.select({
    label: 'Carrier',
    description: 'Leave empty for every connected carrier.',
    options: [] as { value: string; label: string }[],
  }),
  labelGetManyServiceCode: Workflow.string({
    label: 'Service code',
    description: 'For example usps_priority_mail.',
    acceptsVariables: true,
  }),
  labelGetManyTrackingNumber: Workflow.string({
    label: 'Tracking number',
    description:
      'Matches the label MASTER tracking number. A child box tracking number will not match here.',
    acceptsVariables: true,
  }),
  labelGetManyBatchId: Workflow.string({ label: 'Batch id', acceptsVariables: true }),
  labelGetManyShipmentId: Workflow.string({ label: 'Shipment id', acceptsVariables: true }),
  labelGetManyExternalShipmentId: Workflow.string({
    label: 'External shipment id',
    acceptsVariables: true,
  }),
  labelGetManyWarehouseId: Workflow.string({ label: 'Warehouse id', acceptsVariables: true }),
  labelGetManyCreatedAtStart: Workflow.datetime({
    label: 'Created from',
    acceptsVariables: true,
  }),
  labelGetManyCreatedAtEnd: Workflow.datetime({ label: 'Created to', acceptsVariables: true }),
  labelGetManySortBy: Workflow.select({
    label: 'Sort by',
    options: LABEL_SORT_BY_OPTIONS,
    default: 'created_at',
  }),
  labelGetManySortDir: Workflow.select({
    label: 'Sort direction',
    options: SORT_DIR_OPTIONS,
    default: 'desc',
  }),
  labelGetManyPage: Workflow.number({
    label: 'Page',
    description: '1-based.',
    integer: true,
    default: 1,
    acceptsVariables: true,
  }),
  labelGetManyPageSize: Workflow.number({
    label: 'Page size',
    integer: true,
    default: 25,
    acceptsVariables: true,
  }),

  // --- label.get: GET /v2/labels/{id} or /v2/labels/external_shipment_id/{id} ---
  labelGetIdKind: Workflow.select({
    label: 'Look up by',
    options: GET_ID_KIND_OPTIONS,
    default: 'labelId',
  }),
  labelGetId: Workflow.string({
    label: 'Id',
    description: 'A ShipStation label id (se-...) or your own external shipment id.',
    acceptsVariables: true,
  }),

  // --- label.create: three modes, one operation ---
  labelCreateFrom: Workflow.select({
    label: 'Purchase from',
    options: CREATE_FROM_OPTIONS,
    default: 'shipment',
  }),
  labelCreateShipmentId: Workflow.string({
    label: 'Shipment id',
    description: 'The shipment to buy a label for.',
    acceptsVariables: true,
  }),
  labelCreateRateId: Workflow.string({
    label: 'Rate id',
    description: 'A rate id from a Rate operation. Rates expire, so buy from a fresh one.',
    acceptsVariables: true,
  }),
  labelCreateCarrierId: Workflow.select({
    label: 'Carrier',
    options: [] as { value: string; label: string }[],
  }),
  labelCreateServiceCode: Workflow.string({
    label: 'Service code',
    description: 'For example usps_priority_mail. Use Carrier, Get Services to list them.',
    acceptsVariables: true,
  }),
  labelCreateShipTo: shippingAddress({
    label: 'Ship to',
    description: 'The delivery address. ShipStation requires name, street, city, state, postal.',
  }),
  labelCreateShipToPhone: shippingPhone({ label: 'Ship to phone' }),
  labelCreateShipFromMode: shipFromMode,
  labelCreateWarehouseId: Workflow.select({
    label: 'Warehouse',
    options: [] as { value: string; label: string }[],
  }),
  labelCreateShipFrom: shippingAddress({ label: 'Ship from' }),
  labelCreateShipFromPhone: shippingPhone({ label: 'Ship from phone' }),
  labelCreatePackages: packagesArray({
    label: 'Packages',
    description: 'One row per physical box. Each box gets its own tracking number.',
  }),
  labelCreateConfirmation: Workflow.select({
    label: 'Delivery confirmation',
    options: CONFIRMATION_OPTIONS,
    default: 'none',
  }),
  labelCreateInsuranceProvider: Workflow.select({
    label: 'Insurance',
    description: 'Per-package insured values are set on each package row.',
    options: INSURANCE_OPTIONS,
    default: 'none',
  }),
  labelCreateShipDate: Workflow.date({ label: 'Ship date', acceptsVariables: true }),
  labelCreateExternalShipmentId: Workflow.string({
    label: 'External shipment id',
    description: 'Your own id for this shipment. Makes Get by external shipment id work later.',
    acceptsVariables: true,
  }),
  labelCreateValidateAddress: Workflow.select({
    label: 'Address validation',
    options: VALIDATE_ADDRESS_OPTIONS,
    default: 'no_validation',
  }),
  labelCreateLabelFormat: Workflow.select({
    label: 'Label format',
    options: LABEL_FORMAT_OPTIONS,
    default: 'pdf',
  }),
  labelCreateLabelLayout: Workflow.select({
    label: 'Label layout',
    options: LABEL_LAYOUT_OPTIONS,
    default: '4x6',
  }),
  labelCreateTestLabel: Workflow.boolean({
    label: 'Test label',
    description: 'Produces a sample label and is not charged. Not usable for shipping.',
    default: false,
  }),

  // --- label.void: PUT /v2/labels/{id}/void ---
  labelVoidId: Workflow.string({
    label: 'Label id',
    description: 'Requests a refund from the carrier. Approval is not guaranteed.',
    acceptsVariables: true,
  }),

  // --- label.cancelRefund: POST /v2/labels/{id}/cancel_refund ---
  labelCancelRefundId: Workflow.string({
    label: 'Label id',
    description:
      'Withdraws a refund that voiding scheduled, so the postage stays charged. Only a ' +
      'label whose refund is still scheduled can be pulled back.',
    acceptsVariables: true,
  }),

  // --- label.createReturn: POST /v2/labels/{id}/return ---
  labelCreateReturnId: Workflow.string({
    label: 'Outbound label id',
    description: 'The label being returned. The return label ships the reverse of it.',
    acceptsVariables: true,
  }),
  labelCreateReturnLabelFormat: Workflow.select({
    label: 'Label format',
    options: LABEL_FORMAT_OPTIONS,
    default: 'pdf',
  }),
  labelCreateReturnLabelLayout: Workflow.select({
    label: 'Label layout',
    options: LABEL_LAYOUT_OPTIONS,
    default: '4x6',
  }),

  // --- label.track: GET /v2/labels/{id}/track ---
  labelTrackId: Workflow.string({
    label: 'Label id',
    description:
      'Returns MASTER tracking only: the carrier status of the box with sequence 1. For the status of every box, use the Tracking resource.',
    acceptsVariables: true,
  }),
}

/**
 * One box on a label.
 *
 * Mirrors `ProjectedPackage` from `tools/shared/project-label.ts` exactly, so
 * the executor hands the projector's output straight through with no second
 * mapping to drift.
 */
const labelPackageFields = {
  packageId: Workflow.string({ label: 'packageId' }),
  sequence: Workflow.number({ label: 'sequence', integer: true }),
  trackingNumber: Workflow.string({ label: 'trackingNumber' }),
  isMaster: Workflow.boolean({ label: 'isMaster' }),
  weight: Workflow.struct(
    { value: Workflow.number({ label: 'value' }), unit: Workflow.string({ label: 'unit' }) },
    { label: 'weight' }
  ),
  dimensions: Workflow.struct(
    {
      length: Workflow.number({ label: 'length' }),
      width: Workflow.number({ label: 'width' }),
      height: Workflow.number({ label: 'height' }),
      unit: Workflow.string({ label: 'unit' }),
    },
    { label: 'dimensions' }
  ),
}

/** The fields every label-shaped output carries, minus the per-box detail. */
const labelCoreFields = {
  labelId: Workflow.string({ label: 'labelId' }),
  shipmentId: Workflow.string({ label: 'shipmentId' }),
  externalOrderId: Workflow.string({ label: 'externalOrderId' }),
  carrierCode: Workflow.string({ label: 'carrierCode' }),
  serviceCode: Workflow.string({ label: 'serviceCode' }),
  masterTrackingNumber: Workflow.string({ label: 'masterTrackingNumber' }),
  labelStatus: Workflow.string({ label: 'labelStatus' }),
  trackingStatus: Workflow.string({ label: 'trackingStatus' }),
  voided: Workflow.boolean({ label: 'voided' }),
  voidedAt: Workflow.datetime({ label: 'voidedAt' }),
  isReturnLabel: Workflow.boolean({ label: 'isReturnLabel' }),
  createdAt: Workflow.datetime({ label: 'createdAt' }),
  shipDate: Workflow.datetime({ label: 'shipDate' }),
  packageCount: Workflow.number({ label: 'packageCount', integer: true }),
  labelDownloadUrl: Workflow.string({ label: 'labelDownloadUrl' }),
  trackingUrl: Workflow.string({ label: 'trackingUrl' }),
  shipmentCostAmount: Workflow.number({ label: 'shipmentCostAmount' }),
  shipmentCostCurrency: Workflow.string({ label: 'shipmentCostCurrency' }),
}

/** A label in full: every box, ordered by sequence. */
const labelDetailFields = {
  ...labelCoreFields,
  packages: Workflow.array({
    label: 'packages',
    items: Workflow.struct(labelPackageFields, { label: 'package' }),
  }),
}

/**
 * A label in a list.
 *
 * Keeps every tracking number, because they are the point of this app, and
 * drops the per-box weight and dimension objects, which swamp a multi-row
 * response. Use `label.get` for those.
 */
const labelSummaryFields = {
  ...labelCoreFields,
  trackingNumbers: Workflow.array({
    label: 'trackingNumbers',
    description: 'Every box, ordered by sequence. The first entry is the master.',
    items: Workflow.string({ label: 'trackingNumber' }),
  }),
}

/** One carrier scan on the master tracking number. */
const trackEventFields = {
  occurredAt: Workflow.datetime({ label: 'occurredAt' }),
  description: Workflow.string({ label: 'description' }),
  cityLocality: Workflow.string({ label: 'cityLocality' }),
  stateProvince: Workflow.string({ label: 'stateProvince' }),
  postalCode: Workflow.string({ label: 'postalCode' }),
  countryCode: Workflow.string({ label: 'countryCode' }),
  statusCode: Workflow.string({ label: 'statusCode' }),
  statusDescription: Workflow.string({ label: 'statusDescription' }),
  carrierStatusCode: Workflow.string({ label: 'carrierStatusCode' }),
  carrierStatusDescription: Workflow.string({ label: 'carrierStatusDescription' }),
  eventCode: Workflow.string({ label: 'eventCode' }),
  signer: Workflow.string({ label: 'signer' }),
}

/**
 * The variables a `label` operation publishes downstream.
 *
 * Dispatched per operation rather than unioned, so a node that bought a label
 * does not advertise a `labels` array that will always be empty.
 */
export function labelComputeOutputs(operation: string) {
  if (operation === 'getMany') {
    return {
      labels: Workflow.array({
        label: 'labels',
        items: Workflow.struct(labelSummaryFields, { label: 'label' }),
      }),
      total: Workflow.number({ label: 'total', integer: true }),
      page: Workflow.number({ label: 'page', integer: true }),
      pageSize: Workflow.number({ label: 'pageSize', integer: true }),
      hasMore: Workflow.boolean({ label: 'hasMore' }),
    }
  }

  // `cancel_refund` returns the updated label object, same shape as a get.
  if (
    operation === 'get' ||
    operation === 'create' ||
    operation === 'createReturn' ||
    operation === 'cancelRefund'
  ) {
    return { label: Workflow.struct(labelDetailFields, { label: 'label' }) }
  }

  if (operation === 'void') {
    return {
      approved: Workflow.boolean({ label: 'approved' }),
      message: Workflow.string({ label: 'message' }),
      reasonCode: Workflow.string({ label: 'reasonCode' }),
      // NOT `se-`-prefixed label ids. The API types these as
      // `Array of integers (int64)` while every id a label endpoint ACCEPTS
      // must match `^se(-[a-z0-9]+)+$`, so one of these fed back into
      // `label.get` or `label.void` is rejected. Named to make that obvious
      // rather than inviting the round trip.
      voidedLabelIds: Workflow.array({
        label: 'voidedLabelIds',
        items: Workflow.string({ label: 'voidedLabelNumber' }),
      }),
    }
  }

  if (operation === 'track') {
    return {
      // Named for what it is. `GET /v2/labels/{id}/track` answers for the
      // label's own tracking number only; the other boxes are not covered.
      masterTrackingNumber: Workflow.string({ label: 'masterTrackingNumber' }),
      statusCode: Workflow.string({ label: 'statusCode' }),
      statusDescription: Workflow.string({ label: 'statusDescription' }),
      statusDetailCode: Workflow.string({ label: 'statusDetailCode' }),
      statusDetailDescription: Workflow.string({ label: 'statusDetailDescription' }),
      carrierCode: Workflow.string({ label: 'carrierCode' }),
      carrierStatusCode: Workflow.string({ label: 'carrierStatusCode' }),
      carrierStatusDescription: Workflow.string({ label: 'carrierStatusDescription' }),
      carrierDetailCode: Workflow.string({ label: 'carrierDetailCode' }),
      exceptionDescription: Workflow.string({ label: 'exceptionDescription' }),
      shipDate: Workflow.datetime({ label: 'shipDate' }),
      estimatedDeliveryDate: Workflow.datetime({ label: 'estimatedDeliveryDate' }),
      actualDeliveryDate: Workflow.datetime({ label: 'actualDeliveryDate' }),
      trackingUrl: Workflow.string({ label: 'trackingUrl' }),
      events: Workflow.array({
        label: 'events',
        items: Workflow.struct(trackEventFields, { label: 'event' }),
      }),
    }
  }

  return {}
}
