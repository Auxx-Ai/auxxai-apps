// src/blocks/shipstation/resources/shipment/shipment-schema.ts

/**
 * The `shipment` resource's slice of the ShipStation block schema.
 *
 * Eight operations: `getMany`, `get`, `create`, `update`, `cancel`, `addTag`,
 * `removeTag`, `addNote`. See
 * plans/apps/shipstation/shipstation-workflow-expansion-plan.md §6.
 *
 * ## Key naming
 *
 * Seven resources merge into ONE flat `inputs` namespace, so every key here is
 * `shipment<Operation><Field>` in camelCase: `shipmentGetId`,
 * `shipmentGetManyStatus`, `shipmentCreateShipTo`, `shipmentAddTagName`. A bare
 * `getId` would collide with six other resources.
 *
 * ## Addresses and packages
 *
 * `create` and `update` take their addresses from the shared declarations in
 * `shared/address-schema.ts` and their boxes from `shared/packages-schema.ts`,
 * so the four operations across this block that describe a physical shipment
 * cannot drift apart.
 */

import { Workflow } from '@auxx/sdk'
import { shipFromMode, shippingAddress, shippingPhone } from '../../shared/address-schema'
import { packagesArray } from '../../shared/packages-schema'

/**
 * `GET /v2/shipments?shipment_status=`. Verified against the spec's
 * `shipment_status` enum; the empty option means "no filter" rather than a
 * fifth status.
 */
const SHIPMENT_STATUS_FILTER = [
  { value: '', label: 'Any status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'label_purchased', label: 'Label purchased' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

/** The spec's `shipments_sort_by` enum. `modified_at` is what makes the list a delta. */
const SHIPMENT_SORT_BY = [
  { value: 'modified_at', label: 'Last modified' },
  { value: 'created_at', label: 'Created' },
] as const

/** The spec's `sort_dir` enum. */
const SORT_DIR = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
] as const

/**
 * Which identifier `get` was handed.
 *
 * ShipStation exposes two lookups, `GET /v2/shipments/{id}` and
 * `GET /v2/shipments/external_shipment_id/{id}`. They are one block operation
 * with this select rather than two, because a workflow author has one id in
 * hand and only needs to say where it came from.
 */
const SHIPMENT_ID_KIND = [
  { value: 'shipmentId', label: 'ShipStation shipment id' },
  { value: 'externalShipmentId', label: 'External shipment id' },
] as const

/**
 * How an internal note is applied. Both keys are required by
 * `POST /v2/shipments/{id}/internal_notes`; `append` is the default because the
 * operation is named "Add Internal Note" and overwriting is the destructive one.
 */
const NOTE_MODES = [
  { value: 'append', label: 'Append to existing notes' },
  { value: 'overwrite', label: 'Replace existing notes' },
] as const

/** Address validation, as `POST /v2/shipments` accepts it. */
const VALIDATE_ADDRESS_MODES = [
  { value: 'no_validation', label: 'Do not validate' },
  { value: 'validate_only', label: 'Validate only' },
  { value: 'validate_and_clean', label: 'Validate and clean' },
] as const

export const shipmentInputs = {
  // --- Shipment: Get Many ---
  shipmentGetManyStatus: Workflow.select({
    label: 'Status',
    options: [...SHIPMENT_STATUS_FILTER],
    default: '',
  }),
  shipmentGetManyModifiedAtStart: Workflow.datetime({
    label: 'Modified after',
    description: 'The delta cursor. Combine with sort by "Last modified", ascending.',
    acceptsVariables: true,
  }),
  shipmentGetManyModifiedAtEnd: Workflow.datetime({
    label: 'Modified before',
    acceptsVariables: true,
  }),
  shipmentGetManyCreatedAtStart: Workflow.datetime({
    label: 'Created after',
    acceptsVariables: true,
  }),
  shipmentGetManyCreatedAtEnd: Workflow.datetime({
    label: 'Created before',
    acceptsVariables: true,
  }),
  shipmentGetManyStoreId: Workflow.string({ label: 'Store id', acceptsVariables: true }),
  shipmentGetManySalesOrderId: Workflow.string({
    label: 'Sales order id',
    acceptsVariables: true,
  }),
  shipmentGetManyBatchId: Workflow.string({ label: 'Batch id', acceptsVariables: true }),
  shipmentGetManyTag: Workflow.string({ label: 'Tag', acceptsVariables: true }),
  shipmentGetManyShipmentNumber: Workflow.string({
    label: 'Shipment number',
    acceptsVariables: true,
  }),
  shipmentGetManyShipToName: Workflow.string({
    label: 'Ship to name',
    acceptsVariables: true,
  }),
  shipmentGetManyItemKeyword: Workflow.string({
    label: 'Item keyword',
    description: 'Matches against the shipment line items.',
    acceptsVariables: true,
  }),
  shipmentGetManyPage: Workflow.number({
    label: 'Page',
    integer: true,
    min: 1,
    default: 1,
    acceptsVariables: true,
  }),
  shipmentGetManyPageSize: Workflow.number({
    label: 'Page size',
    integer: true,
    min: 1,
    max: 500,
    default: 25,
    acceptsVariables: true,
  }),
  shipmentGetManySortBy: Workflow.select({
    label: 'Sort by',
    options: [...SHIPMENT_SORT_BY],
    default: 'modified_at',
  }),
  shipmentGetManySortDir: Workflow.select({
    label: 'Sort direction',
    options: [...SORT_DIR],
    default: 'desc',
  }),

  // --- Shipment: Get ---
  shipmentGetIdKind: Workflow.select({
    label: 'Look up by',
    options: [...SHIPMENT_ID_KIND],
    default: 'shipmentId',
  }),
  shipmentGetId: Workflow.string({
    label: 'Shipment id',
    description: 'A ShipStation id such as se-123456, or your own external id.',
    required: true,
    acceptsVariables: true,
  }),

  // --- Shipment: Create ---
  shipmentCreateShipTo: shippingAddress({ label: 'Ship to' }),
  shipmentCreateShipToPhone: shippingPhone({ label: 'Ship to phone' }),
  shipmentCreateShipFromMode: shipFromMode,
  shipmentCreateWarehouseId: Workflow.select({
    label: 'Warehouse',
    description: 'The ShipStation warehouse this shipment leaves from.',
    options: [] as { value: string; label: string }[],
  }),
  shipmentCreateShipFrom: shippingAddress({ label: 'Ship from' }),
  shipmentCreateShipFromPhone: shippingPhone({ label: 'Ship from phone' }),
  shipmentCreateCarrierId: Workflow.select({
    label: 'Carrier',
    description: 'The carrier account billed for the shipping charges.',
    options: [] as { value: string; label: string }[],
  }),
  shipmentCreateServiceCode: Workflow.string({
    label: 'Service code',
    description: 'Carrier service, e.g. usps_priority_mail. Leave empty to decide later.',
    acceptsVariables: true,
  }),
  shipmentCreateExternalShipmentId: Workflow.string({
    label: 'External shipment id',
    description: 'Your own identifier, so this shipment can be looked up by it later.',
    acceptsVariables: true,
  }),
  shipmentCreateStoreId: Workflow.string({ label: 'Store id', acceptsVariables: true }),
  shipmentCreateShipDate: Workflow.date({ label: 'Ship date', acceptsVariables: true }),
  shipmentCreateInternalNotes: Workflow.string({
    label: 'Internal notes',
    acceptsVariables: true,
  }),
  shipmentCreateValidateAddress: Workflow.select({
    label: 'Address validation',
    options: [...VALIDATE_ADDRESS_MODES],
    default: 'no_validation',
  }),
  shipmentCreatePackages: packagesArray({ label: 'Packages' }),

  // --- Shipment: Update ---
  shipmentUpdateShipmentId: Workflow.string({
    label: 'Shipment id',
    required: true,
    acceptsVariables: true,
  }),
  shipmentUpdateShipTo: shippingAddress({
    label: 'Ship to',
    description: 'Leave empty to keep the address ShipStation already holds.',
  }),
  shipmentUpdateShipToPhone: shippingPhone({ label: 'Ship to phone' }),
  shipmentUpdateShipFromMode: Workflow.select({
    label: 'Ship from',
    options: [
      { value: 'unchanged', label: 'Leave unchanged' },
      { value: 'warehouse', label: 'A ShipStation warehouse' },
      { value: 'address', label: 'An address' },
    ],
    default: 'unchanged',
  }),
  shipmentUpdateWarehouseId: Workflow.select({
    label: 'Warehouse',
    options: [] as { value: string; label: string }[],
  }),
  shipmentUpdateShipFrom: shippingAddress({ label: 'Ship from' }),
  shipmentUpdateShipFromPhone: shippingPhone({ label: 'Ship from phone' }),
  shipmentUpdateCarrierId: Workflow.select({
    label: 'Carrier',
    options: [] as { value: string; label: string }[],
  }),
  shipmentUpdateServiceCode: Workflow.string({
    label: 'Service code',
    acceptsVariables: true,
  }),
  shipmentUpdateExternalShipmentId: Workflow.string({
    label: 'External shipment id',
    acceptsVariables: true,
  }),
  shipmentUpdateShipmentNumber: Workflow.string({
    label: 'Shipment number',
    acceptsVariables: true,
  }),
  shipmentUpdateStoreId: Workflow.string({ label: 'Store id', acceptsVariables: true }),
  shipmentUpdateShipDate: Workflow.date({ label: 'Ship date', acceptsVariables: true }),
  shipmentUpdateInternalNotes: Workflow.string({
    label: 'Internal notes',
    acceptsVariables: true,
  }),
  shipmentUpdatePackages: packagesArray({
    label: 'Packages',
    description: 'Add a row to replace the boxes on the shipment. Leave empty to keep them.',
  }),

  // --- Shipment: Cancel ---
  shipmentCancelShipmentId: Workflow.string({
    label: 'Shipment id',
    required: true,
    acceptsVariables: true,
  }),

  // --- Shipment: Add Tag ---
  shipmentAddTagShipmentId: Workflow.string({
    label: 'Shipment id',
    required: true,
    acceptsVariables: true,
  }),
  shipmentAddTagName: Workflow.string({
    label: 'Tag',
    description: 'Any string. ShipStation creates the tag on first use.',
    required: true,
    acceptsVariables: true,
  }),

  // --- Shipment: Remove Tag ---
  shipmentRemoveTagShipmentId: Workflow.string({
    label: 'Shipment id',
    required: true,
    acceptsVariables: true,
  }),
  shipmentRemoveTagName: Workflow.string({
    label: 'Tag',
    required: true,
    acceptsVariables: true,
  }),

  // --- Shipment: Add Internal Note ---
  shipmentAddNoteShipmentId: Workflow.string({
    label: 'Shipment id',
    required: true,
    acceptsVariables: true,
  }),
  shipmentAddNoteNote: Workflow.string({
    label: 'Note',
    required: true,
    acceptsVariables: true,
  }),
  shipmentAddNoteMode: Workflow.select({
    label: 'Mode',
    options: [...NOTE_MODES],
    default: 'append',
  }),
}

/**
 * The shipment shape every read and write returns.
 *
 * Flattened deliberately: a workflow author binds `{{node.shipment.shipToName}}`
 * far more often than they walk a nested address, and the block's outputs are
 * variables rather than an API response to be forwarded.
 */
const shipmentFields = {
  shipmentId: Workflow.string(),
  externalShipmentId: Workflow.string(),
  externalOrderId: Workflow.string(),
  shipmentNumber: Workflow.string(),
  shipmentStatus: Workflow.string(),
  carrierId: Workflow.string(),
  serviceCode: Workflow.string(),
  warehouseId: Workflow.string(),
  storeId: Workflow.string(),
  shipDate: Workflow.string(),
  createdAt: Workflow.datetime(),
  modifiedAt: Workflow.datetime(),
  internalNotes: Workflow.string(),
  isReturn: Workflow.boolean(),
  totalWeightValue: Workflow.number(),
  totalWeightUnit: Workflow.string(),
  packageCount: Workflow.number({ integer: true }),
  tags: Workflow.array({ label: 'tags', items: Workflow.string() }),
  shipToName: Workflow.string(),
  shipToPhone: Workflow.string(),
  shipToLine1: Workflow.string(),
  shipToLine2: Workflow.string(),
  shipToCity: Workflow.string(),
  shipToState: Workflow.string(),
  shipToPostalCode: Workflow.string(),
  shipToCountry: Workflow.string(),
}

/** The output variables one shipment operation produces. */
export function shipmentComputeOutputs(operation: string) {
  if (operation === 'get' || operation === 'create' || operation === 'update') {
    return {
      shipment: Workflow.struct(shipmentFields, { label: 'shipment' }),
    }
  }

  if (operation === 'getMany') {
    return {
      shipments: Workflow.array({
        label: 'shipments',
        items: Workflow.struct(shipmentFields, { label: 'shipment' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
      total: Workflow.number({ label: 'total', integer: true }),
      page: Workflow.number({ label: 'page', integer: true }),
      pages: Workflow.number({ label: 'pages', integer: true }),
    }
  }

  if (operation === 'cancel') {
    return {
      shipmentId: Workflow.string({ label: 'shipmentId' }),
      cancelled: Workflow.boolean({ label: 'cancelled' }),
    }
  }

  if (operation === 'addTag' || operation === 'removeTag') {
    return {
      shipmentId: Workflow.string({ label: 'shipmentId' }),
      tagName: Workflow.string({ label: 'tagName' }),
      tags: Workflow.array({ label: 'tags', items: Workflow.string() }),
    }
  }

  if (operation === 'addNote') {
    return {
      shipmentId: Workflow.string({ label: 'shipmentId' }),
      internalNotes: Workflow.string({ label: 'internalNotes' }),
    }
  }

  return {}
}
