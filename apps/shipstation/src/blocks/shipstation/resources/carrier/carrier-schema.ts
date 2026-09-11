// src/blocks/shipstation/resources/carrier/carrier-schema.ts

/**
 * The `carrier` resource: three reads over the account's connected carriers.
 *
 * Input keys follow the block convention `<resource><Operation><Field>`, because
 * all seven resources merge into one flat `inputs` namespace. See
 * `shipstation-schema.ts`.
 *
 * Both `getServices` and `getPackageTypes` are CARRIER-SCOPED: ShipStation has
 * no account-wide list of either, only `/v2/carriers/{carrier_id}/services` and
 * `/v2/carriers/{carrier_id}/packages`. That is why each carries its own carrier
 * id rather than sharing one, which the flat namespace could not express anyway.
 */

import { Workflow } from '@auxx/sdk'

export const carrierInputs = {
  // --- Carrier: Get Many ---
  carrierGetManyPage: Workflow.number({
    label: 'Page',
    description: 'First page is 1.',
    integer: true,
    min: 1,
    acceptsVariables: true,
  }),
  carrierGetManyPageSize: Workflow.number({
    label: 'Page Size',
    description: 'Carriers per page. ShipStation defaults to 25.',
    integer: true,
    min: 1,
    acceptsVariables: true,
  }),

  // --- Carrier: Get Services ---
  carrierGetServicesCarrierId: Workflow.select({
    label: 'Carrier',
    description: 'The connected carrier whose services to list.',
    options: [] as { value: string; label: string }[],
    acceptsVariables: true,
  }),

  // --- Carrier: Get Package Types ---
  carrierGetPackageTypesCarrierId: Workflow.select({
    label: 'Carrier',
    description: 'The connected carrier whose package types to list.',
    options: [] as { value: string; label: string }[],
    acceptsVariables: true,
  }),
}

const carrierFields = {
  carrierId: Workflow.string({ label: 'carrierId' }),
  carrierCode: Workflow.string({ label: 'carrierCode' }),
  friendlyName: Workflow.string({ label: 'friendlyName' }),
  nickname: Workflow.string({ label: 'nickname' }),
  accountNumber: Workflow.string({ label: 'accountNumber' }),
  primary: Workflow.boolean({ label: 'primary' }),
  requiresFundedAmount: Workflow.boolean({ label: 'requiresFundedAmount' }),
  balance: Workflow.number({ label: 'balance' }),
  hasMultiPackageSupportingServices: Workflow.boolean({
    label: 'hasMultiPackageSupportingServices',
  }),
  supportsLabelMessages: Workflow.boolean({ label: 'supportsLabelMessages' }),
  disabledByBillingPlan: Workflow.boolean({ label: 'disabledByBillingPlan' }),
}

const serviceFields = {
  carrierId: Workflow.string({ label: 'carrierId' }),
  carrierCode: Workflow.string({ label: 'carrierCode' }),
  serviceCode: Workflow.string({ label: 'serviceCode' }),
  name: Workflow.string({ label: 'name' }),
  domestic: Workflow.boolean({ label: 'domestic' }),
  international: Workflow.boolean({ label: 'international' }),
  isMultiPackageSupported: Workflow.boolean({ label: 'isMultiPackageSupported' }),
  sendRates: Workflow.boolean({ label: 'sendRates' }),
}

/**
 * A carrier-provided package type.
 *
 * Dimensions are flattened to `dimensionUnit` / `length` / `width` / `height`
 * rather than nested, so a row binds straight into the block's package array,
 * whose struct uses exactly those keys.
 */
const packageTypeFields = {
  packageCode: Workflow.string({ label: 'packageCode' }),
  name: Workflow.string({ label: 'name' }),
  description: Workflow.string({ label: 'description' }),
  dimensionUnit: Workflow.string({ label: 'dimensionUnit' }),
  length: Workflow.number({ label: 'length' }),
  width: Workflow.number({ label: 'width' }),
  height: Workflow.number({ label: 'height' }),
}

/** The variables each carrier operation publishes downstream. */
export function carrierComputeOutputs(operation: string) {
  if (operation === 'getMany') {
    return {
      carriers: Workflow.array({
        label: 'carriers',
        items: Workflow.struct(carrierFields, { label: 'carrier' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
      total: Workflow.number({ label: 'total', integer: true }),
      page: Workflow.number({ label: 'page', integer: true }),
      pages: Workflow.number({ label: 'pages', integer: true }),
    }
  }
  if (operation === 'getServices') {
    return {
      services: Workflow.array({
        label: 'services',
        items: Workflow.struct(serviceFields, { label: 'service' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  if (operation === 'getPackageTypes') {
    return {
      packageTypes: Workflow.array({
        label: 'packageTypes',
        items: Workflow.struct(packageTypeFields, { label: 'packageType' }),
      }),
      count: Workflow.number({ label: 'count', integer: true }),
    }
  }
  return {}
}
