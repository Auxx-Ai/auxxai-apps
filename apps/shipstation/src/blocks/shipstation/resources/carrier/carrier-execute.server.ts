// src/blocks/shipstation/resources/carrier/carrier-execute.server.ts

/**
 * Executor for the `carrier` resource. Three reads, no writes: connecting a
 * carrier happens in ShipStation's own UI and is deliberately out of scope.
 */

import { InvalidInputError } from '@auxx/sdk/server'
import { getShipstationApiKey } from '../../../../tools/shared/connection'
import { shipstationApi } from '../../../../tools/shared/shipstation-api'

interface RawCarrier {
  carrier_id?: string
  carrier_code?: string
  friendly_name?: string
  nickname?: string
  account_number?: string
  primary?: boolean
  requires_funded_amount?: boolean
  balance?: number
  has_multi_package_supporting_services?: boolean
  supports_label_messages?: boolean
  disabled_by_billing_plan?: boolean
}

interface RawService {
  carrier_id?: string
  carrier_code?: string
  service_code?: string
  name?: string
  domestic?: boolean
  international?: boolean
  is_multi_package_supported?: boolean
  send_rates?: boolean
}

interface RawDimensions {
  unit?: string
  length?: number
  width?: number
  height?: number
}

interface RawPackageType {
  package_code?: string
  name?: string
  description?: string | null
  dimensions?: RawDimensions
}

interface CarrierListResponse {
  carriers?: RawCarrier[]
  total?: number
  page?: number
  pages?: number
}

/** Execute one `carrier` operation. */
export async function executeCarrier(operation: string, input: any): Promise<Record<string, any>> {
  const apiKey = getShipstationApiKey()

  switch (operation) {
    case 'getMany': {
      const result = await shipstationApi<CarrierListResponse>('/carriers', apiKey, {
        page: toPositiveInteger(input.carrierGetManyPage),
        page_size: toPositiveInteger(input.carrierGetManyPageSize),
        // The services and package types each carrier supports are their own
        // operations, with their own outputs. Asking for them here would attach
        // two long arrays to every carrier row that nothing downstream reads.
        include_extended_details: false,
      })

      const carriers = (result.carriers ?? []).map(projectCarrier)
      return {
        carriers,
        count: carriers.length,
        total: result.total ?? carriers.length,
        page: result.page ?? 1,
        pages: result.pages ?? 1,
      }
    }

    case 'getServices': {
      const carrierId = requireCarrierId(input.carrierGetServicesCarrierId)
      const result = await shipstationApi<{ services?: RawService[] }>(
        `/carriers/${encodeURIComponent(carrierId)}/services`,
        apiKey
      )

      const services = (result.services ?? []).map(projectService)
      return { services, count: services.length }
    }

    case 'getPackageTypes': {
      const carrierId = requireCarrierId(input.carrierGetPackageTypesCarrierId)
      const result = await shipstationApi<{ packages?: RawPackageType[] }>(
        `/carriers/${encodeURIComponent(carrierId)}/packages`,
        apiKey
      )

      const packageTypes = (result.packages ?? []).map(projectPackageType)
      return { packageTypes, count: packageTypes.length }
    }

    default:
      throw new Error(`Unknown carrier operation: ${operation}`)
  }
}

/**
 * A carrier id is a path segment, so an empty one would silently become
 * `GET /v2/carriers//services` and a confusing 404 rather than a 400 naming the
 * missing input.
 */
function requireCarrierId(value: unknown): string {
  const carrierId = String(value ?? '').trim()
  if (!carrierId) throw new InvalidInputError('A carrier is required.')
  return carrierId
}

/** `undefined` for anything that is not a usable page number, so the query drops it. */
function toPositiveInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return Math.trunc(parsed)
}

function projectCarrier(carrier: RawCarrier) {
  return {
    carrierId: carrier.carrier_id ?? '',
    carrierCode: carrier.carrier_code ?? '',
    friendlyName: carrier.friendly_name ?? '',
    nickname: carrier.nickname ?? '',
    accountNumber: carrier.account_number ?? '',
    primary: Boolean(carrier.primary),
    requiresFundedAmount: Boolean(carrier.requires_funded_amount),
    balance: typeof carrier.balance === 'number' ? carrier.balance : 0,
    hasMultiPackageSupportingServices: Boolean(carrier.has_multi_package_supporting_services),
    supportsLabelMessages: Boolean(carrier.supports_label_messages),
    disabledByBillingPlan: Boolean(carrier.disabled_by_billing_plan),
  }
}

function projectService(service: RawService) {
  return {
    carrierId: service.carrier_id ?? '',
    carrierCode: service.carrier_code ?? '',
    serviceCode: service.service_code ?? '',
    name: service.name ?? '',
    domestic: Boolean(service.domestic),
    international: Boolean(service.international),
    isMultiPackageSupported: Boolean(service.is_multi_package_supported),
    sendRates: Boolean(service.send_rates),
  }
}

/**
 * Flattened deliberately: the keys match the block's package row
 * (`dimensionUnit` / `length` / `width` / `height`), so a package type binds
 * straight into a shipment's packages array.
 *
 * `package_id` is not projected. ShipStation documents it as always null on
 * carrier-provided types, so surfacing it would only offer an id that is never
 * usable.
 */
function projectPackageType(packageType: RawPackageType) {
  const dimensions = packageType.dimensions ?? {}
  return {
    packageCode: packageType.package_code ?? '',
    name: packageType.name ?? '',
    description: packageType.description ?? '',
    dimensionUnit: dimensions.unit ?? '',
    length: typeof dimensions.length === 'number' ? dimensions.length : 0,
    width: typeof dimensions.width === 'number' ? dimensions.width : 0,
    height: typeof dimensions.height === 'number' ? dimensions.height : 0,
  }
}
