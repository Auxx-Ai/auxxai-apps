// src/blocks/shipstation/resources/rate/rate-execute.server.ts

/**
 * Executor for the `rate` resource.
 *
 * Three endpoints, one projection. Every operation ends in the same rate list
 * shape so a workflow can swap an estimate for a real rate shop without
 * rewriting the downstream nodes.
 *
 * The body builders and the projection are exported separately from the
 * executor: a rate body is the most intricate thing this block constructs, and
 * it is worth asserting against without a connection or a stubbed transport.
 */

import { InvalidInputError } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../../../tools/shared/connection'
import { shipstationApi } from '../../../../tools/shared/shipstation-api'
import {
  type AddressStructInput,
  type ShipstationPackage,
  missingAddressFields,
  toShipstationAddress,
  toShipstationPackage,
} from '../../shared/to-shipstation-address'

/** ShipStation's `monetary_value`: a decimal amount plus a currency code. */
interface MonetaryValue {
  amount?: number
  currency?: string
}

/** The subset of ShipStation's `rate` / `rate-estimate` this block projects. */
interface RateResponse {
  rate_id?: string
  rate_type?: string
  carrier_id?: string
  carrier_code?: string
  carrier_friendly_name?: string
  carrier_nickname?: string
  service_code?: string
  service_type?: string
  package_type?: string
  shipping_amount?: MonetaryValue
  insurance_amount?: MonetaryValue
  confirmation_amount?: MonetaryValue
  other_amount?: MonetaryValue
  tax_amount?: MonetaryValue
  delivery_days?: number
  carrier_delivery_days?: string
  estimated_delivery_date?: string
  ship_date?: string
  guaranteed_service?: boolean
  negotiated_rate?: boolean
  trackable?: boolean
  zone?: number
  validation_status?: string
  warning_messages?: string[]
  error_messages?: string[]
}

/** `rates_information`, the body of both `POST /v2/rates` and the shipment rate list. */
interface RatesInformation {
  rates?: RateResponse[]
  invalid_rates?: RateResponse[]
  rate_request_id?: string
  shipment_id?: string
  status?: string
  errors?: { message?: string }[]
}

interface CalculateRatesResponse extends Record<string, unknown> {
  rate_response?: RatesInformation
  shipment_id?: string
}

/** A projected rate, as the block publishes it. */
export type ProjectedRate = ReturnType<typeof projectRate>

/**
 * Decimal currency to minor units.
 *
 * The platform's `currency` field type carries an integer number of cents, and
 * ShipStation answers with decimals (`12.5`). Rounding here rather than at the
 * end means the individual amounts a workflow renders always add up to the
 * total it renders, which would not hold if the total were rounded separately.
 */
function toCents(value: MonetaryValue | undefined): number {
  const amount = value?.amount
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

/**
 * The currency a rate is denominated in.
 *
 * Read from whichever leg carries one, because a zero insurance or confirmation
 * charge can come back with an empty currency while the shipping leg has it.
 */
function rateCurrency(rate: RateResponse): string {
  const candidates = [
    rate.shipping_amount,
    rate.other_amount,
    rate.insurance_amount,
    rate.confirmation_amount,
    rate.tax_amount,
  ]
  for (const candidate of candidates) {
    if (candidate?.currency) return candidate.currency
  }
  return ''
}

/**
 * Project one rate.
 *
 * `rateId` is empty on an estimate. ShipStation's `rate-estimate` schema has no
 * `rate_id` at all, which is the API saying an estimate is not purchasable; the
 * key stays in the output shape so the three operations agree, and it reads as
 * an empty string rather than disappearing.
 */
export function projectRate(rate: RateResponse) {
  const shippingAmount = toCents(rate.shipping_amount)
  const insuranceAmount = toCents(rate.insurance_amount)
  const confirmationAmount = toCents(rate.confirmation_amount)
  const otherAmount = toCents(rate.other_amount)

  return {
    rateId: rate.rate_id ?? '',
    rateType: rate.rate_type ?? '',
    carrierId: rate.carrier_id ?? '',
    carrierCode: rate.carrier_code ?? '',
    carrierFriendlyName: rate.carrier_friendly_name ?? '',
    carrierNickname: rate.carrier_nickname ?? '',
    serviceCode: rate.service_code ?? '',
    serviceType: rate.service_type ?? '',
    packageType: rate.package_type ?? '',
    currency: rateCurrency(rate),
    // ShipStation's own field descriptions define the purchase price as
    // shipping + insurance + confirmation + other. Tax is excluded there, so it
    // is excluded here; it is surfaced on its own instead.
    totalAmount: shippingAmount + insuranceAmount + confirmationAmount + otherAmount,
    shippingAmount,
    insuranceAmount,
    confirmationAmount,
    otherAmount,
    taxAmount: toCents(rate.tax_amount),
    deliveryDays: typeof rate.delivery_days === 'number' ? rate.delivery_days : 0,
    carrierDeliveryDays: rate.carrier_delivery_days ?? '',
    estimatedDeliveryDate: rate.estimated_delivery_date ?? '',
    shipDate: rate.ship_date ?? '',
    guaranteedService: rate.guaranteed_service ?? false,
    negotiatedRate: rate.negotiated_rate ?? false,
    trackable: rate.trackable ?? false,
    zone: typeof rate.zone === 'number' ? rate.zone : 0,
    validationStatus: rate.validation_status ?? '',
    warningMessages: rate.warning_messages ?? [],
    errorMessages: rate.error_messages ?? [],
  }
}

/**
 * Cheapest first, then fastest, then a stable tiebreak.
 *
 * ShipStation returns rates in carrier order, which is meaningless to an author
 * picking one. The whole point of a rate shop is the cheapest option, so that is
 * the primary key; delivery days breaks a price tie (a rate with no delivery
 * estimate sorts last rather than first, since `0` would otherwise read as
 * same-day); service code breaks the rest, so two runs over the same response
 * always produce the same order.
 */
export function sortRates(rates: ProjectedRate[]): ProjectedRate[] {
  const speed = (rate: ProjectedRate) =>
    rate.deliveryDays > 0 ? rate.deliveryDays : Number.MAX_SAFE_INTEGER

  return [...rates].sort((a, b) => {
    if (a.totalAmount !== b.totalAmount) return a.totalAmount - b.totalAmount
    if (speed(a) !== speed(b)) return speed(a) - speed(b)
    if (a.carrierCode !== b.carrierCode) return a.carrierCode.localeCompare(b.carrierCode)
    return a.serviceCode.localeCompare(b.serviceCode)
  })
}

/** The `rates` / `count` / `cheapest` triple every rate operation returns. */
function projectRateList(rates: RateResponse[] | undefined) {
  const sorted = sortRates((rates ?? []).map(projectRate))
  return { rates: sorted, count: sorted.length, cheapest: sorted[0] ?? null }
}

/** Split a comma separated input into trimmed, non-empty values. */
function splitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }
  return String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/**
 * A multi-select's value.
 *
 * The host hands a `multi` select an array, but a workflow author may bind a
 * variable to it instead and get a comma separated string, so both are read.
 */
function readIdList(value: unknown): string[] {
  return splitList(value)
}

/** `Workflow.date` hands back an ISO date or an empty string. */
function readDate(value: unknown): string | undefined {
  const text = String(value ?? '').trim()
  return text ? text : undefined
}

function readAddress(value: unknown): AddressStructInput | undefined {
  return value && typeof value === 'object' ? (value as AddressStructInput) : undefined
}

/** ShipStation's estimate body. Flat locality fields, not an address object. */
export interface EstimateRatesBody {
  from_country_code: string
  from_postal_code: string
  from_city_locality: string
  from_state_province: string
  to_country_code: string
  to_postal_code: string
  to_city_locality: string
  to_state_province: string
  weight: { value: number; unit: string }
  ship_date: string
  dimensions?: { unit: string; length: number; width: number; height: number }
  confirmation?: string
  address_residential_indicator?: string
  carrier_ids?: string[]
}

/**
 * Build the `POST /v2/rates/estimate` body.
 *
 * The endpoint's schema requires country, postal code, city AND state on both
 * ends plus a weight and a ship date, and nothing else. Anything missing is
 * named here rather than sent, because ShipStation answers a partial estimate
 * body with a 400 whose message does not say which end was short.
 *
 * `ship_date` defaults to today: it is required, and "rate for today" is the
 * only sensible reading of an author who left it empty.
 *
 * @throws InvalidInputError naming every missing part.
 */
export function buildEstimateBody(input: Record<string, any>): EstimateRatesBody {
  const from = readAddress(input.rateEstimateShipFrom) ?? {}
  const to = readAddress(input.rateEstimateShipTo) ?? {}

  const missing: string[] = []
  const part = (value: string | undefined, label: string) => {
    const text = (value ?? '').trim()
    if (!text) missing.push(label)
    return text
  }

  const body: EstimateRatesBody = {
    from_country_code: part(from.country, 'ship from country').toUpperCase(),
    from_postal_code: part(from.zipCode, 'ship from postal code'),
    from_city_locality: part(from.city, 'ship from city'),
    from_state_province: part(from.state, 'ship from state or province'),
    to_country_code: part(to.country, 'ship to country').toUpperCase(),
    to_postal_code: part(to.zipCode, 'ship to postal code'),
    to_city_locality: part(to.city, 'ship to city'),
    to_state_province: part(to.state, 'ship to state or province'),
    weight: {
      value: Number(input.rateEstimateWeightValue ?? 0),
      unit: input.rateEstimateWeightUnit || 'ounce',
    },
    ship_date: readDate(input.rateEstimateShipDate) ?? new Date().toISOString(),
  }

  if (!(body.weight.value > 0)) missing.push('weight')

  if (missing.length > 0) {
    throw new InvalidInputError(`A rate estimate needs ${missing.join(', ')}.`)
  }

  const length = Number(input.rateEstimateLength ?? 0)
  const width = Number(input.rateEstimateWidth ?? 0)
  const height = Number(input.rateEstimateHeight ?? 0)
  const dimensionUnit = input.rateEstimateDimensionUnit
  // All four or none. A box with a length and no height is not a smaller
  // request to ShipStation, it is a rejected one.
  if (length > 0 && width > 0 && height > 0 && dimensionUnit) {
    body.dimensions = { unit: dimensionUnit, length, width, height }
  }

  if (input.rateEstimateConfirmation && input.rateEstimateConfirmation !== 'none') {
    body.confirmation = input.rateEstimateConfirmation
  }

  // The indicator can come from the Ship to address itself or from the sibling
  // override. The override wins ONLY when it answers the question: `unknown` is
  // the field's default and means "not answered", so it must not shadow a `yes`
  // carried on the address. An unanswered indicator is then left off entirely
  // rather than asserted, because it drives a carrier surcharge.
  const override = input.rateEstimateResidential
  const residential = override && override !== 'unknown' ? override : to.residential
  if (residential && residential !== 'unknown') {
    body.address_residential_indicator = residential
  }

  const carrierIds = readIdList(input.rateEstimateCarrierIds)
  if (carrierIds.length > 0) body.carrier_ids = carrierIds

  return body
}

/** ShipStation's rate shop body: rate options plus the shipment to rate. */
export interface CalculateRatesBody {
  rate_options: {
    carrier_ids: string[]
    service_codes?: string[]
    package_types?: string[]
    calculate_tax_amount?: boolean
    preferred_currency?: string
    is_return?: boolean
  }
  shipment: {
    ship_to: Record<string, unknown>
    ship_from?: Record<string, unknown>
    warehouse_id?: string
    packages: ShipstationPackage[]
    confirmation?: string
    ship_date?: string
  }
}

/**
 * Build the `POST /v2/rates` body.
 *
 * 🛑 This body is NOT a flat shipment. It is `{ rate_options, shipment }`, where
 * `rate_options.carrier_ids` is required and carries the carrier set, and the
 * shipment carries the addresses and boxes. Putting the carrier inside the
 * shipment (which also has a `carrier_id`) rates one service rather than
 * shopping, which is the opposite of what this operation is for.
 *
 * The origin is either a warehouse or an address, never both: ShipStation's
 * shipment schema notes "Either `ship_from` or `warehouse_id` must be set".
 *
 * @throws InvalidInputError naming what is missing.
 */
export function buildRateShopBody(input: Record<string, any>): CalculateRatesBody {
  const carrierIds = readIdList(input.rateGetManyCarrierIds)
  if (carrierIds.length === 0) {
    throw new InvalidInputError('A rate shop needs at least one carrier.')
  }

  const shipTo = toShipstationAddress(
    readAddress(input.rateGetManyShipTo),
    input.rateGetManyShipToPhone
  )
  const missing = missingAddressFields(shipTo).map((field) => `a ship to ${field}`)

  const rows = Array.isArray(input.rateGetManyPackages) ? input.rateGetManyPackages : []
  const packages = rows.map(toShipstationPackage)
  if (packages.length === 0) missing.push('at least one package')
  else if (packages.some((pkg) => !(pkg.weight.value > 0)))
    missing.push('a weight on every package')

  const shipment: CalculateRatesBody['shipment'] = { ship_to: { ...shipTo }, packages }

  if (input.rateGetManyShipFromMode === 'address') {
    const shipFrom = toShipstationAddress(
      readAddress(input.rateGetManyShipFrom),
      input.rateGetManyShipFromPhone
    )
    missing.push(...missingAddressFields(shipFrom).map((field) => `a ship from ${field}`))
    shipment.ship_from = { ...shipFrom }
  } else {
    const warehouseId = String(input.rateGetManyWarehouseId ?? '').trim()
    if (!warehouseId) missing.push('a ship from warehouse')
    else shipment.warehouse_id = warehouseId
  }

  if (missing.length > 0) {
    throw new InvalidInputError(`A rate shop needs ${missing.join(', ')}.`)
  }

  if (input.rateGetManyConfirmation && input.rateGetManyConfirmation !== 'none') {
    shipment.confirmation = input.rateGetManyConfirmation
  }
  const shipDate = readDate(input.rateGetManyShipDate)
  if (shipDate) shipment.ship_date = shipDate

  const rateOptions: CalculateRatesBody['rate_options'] = { carrier_ids: carrierIds }
  const serviceCodes = splitList(input.rateGetManyServiceCodes)
  if (serviceCodes.length > 0) rateOptions.service_codes = serviceCodes
  const packageTypes = splitList(input.rateGetManyPackageTypes)
  if (packageTypes.length > 0) rateOptions.package_types = packageTypes
  if (input.rateGetManyCalculateTaxAmount) rateOptions.calculate_tax_amount = true
  if (input.rateGetManyIsReturn) rateOptions.is_return = true
  const preferredCurrency = String(input.rateGetManyPreferredCurrency ?? '').trim()
  if (preferredCurrency) rateOptions.preferred_currency = preferredCurrency.toLowerCase()

  return { rate_options: rateOptions, shipment }
}

/**
 * Project a `rates_information` body.
 *
 * `invalid_rates` is kept rather than merged into `rates`: a rate that failed
 * validation cannot be bought, and silently listing it next to the buyable ones
 * would let a workflow pick it as the cheapest.
 */
export function projectRatesInformation(information: RatesInformation | undefined) {
  const body = information ?? {}
  return {
    ...projectRateList(body.rates),
    invalidRates: (body.invalid_rates ?? []).map(projectRate),
    rateRequestId: body.rate_request_id ?? '',
    shipmentId: body.shipment_id ?? '',
    status: body.status ?? '',
    errors: (body.errors ?? []).map((error) => error.message ?? '').filter(Boolean),
  }
}

/** Run one `rate` operation. */
export async function executeRate(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const apiKey = getShipstationApiKey()

  switch (operation) {
    case 'estimate': {
      const body = buildEstimateBody(input)
      const response = await shipstationApi<RateResponse[]>({
        endpoint: '/rates/estimate',
        apiKey,
        method: 'POST',
        body,
      })
      // The estimate endpoint answers with a bare array, not a
      // `rates_information` envelope, so there is no request id or status here.
      return projectRateList(Array.isArray(response) ? response : [])
    }

    case 'getMany': {
      const body = buildRateShopBody(input)
      const response = await shipstationApi<CalculateRatesResponse>({
        endpoint: '/rates',
        apiKey,
        method: 'POST',
        body,
      })
      const information = response?.rate_response ?? {}
      return {
        ...projectRatesInformation(information),
        // The envelope's own shipment id is the authority: `rate_response`
        // carries one too, but a rate shop over an inline shipment leaves it
        // empty while the envelope names the shipment ShipStation created.
        shipmentId: response?.shipment_id || information.shipment_id || '',
      }
    }

    case 'getForShipment': {
      const shipmentId = String(input.rateGetForShipmentShipmentId ?? '').trim()
      if (!shipmentId) {
        throw new InvalidInputError('A shipment id is required to list its rates.')
      }
      const createdAtStart = String(input.rateGetForShipmentCreatedAtStart ?? '').trim()
      const response = await shipstationApi<RatesInformation>(
        `/shipments/${encodeURIComponent(shipmentId)}/rates`,
        apiKey,
        createdAtStart ? { created_at_start: createdAtStart } : {}
      )
      return {
        ...projectRatesInformation(response),
        shipmentId: response?.shipment_id || shipmentId,
      }
    }

    default:
      throw new Error(`Unknown rate operation: ${operation}`)
  }
}
