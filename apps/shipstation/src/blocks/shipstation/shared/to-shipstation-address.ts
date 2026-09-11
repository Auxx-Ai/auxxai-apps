// src/blocks/shipstation/shared/to-shipstation-address.ts

/**
 * Convert the platform's canonical `AddressStruct` into ShipStation's address
 * shape, and the block's package rows into ShipStation `package` objects.
 *
 * Kept pure and SDK-free so it is directly testable.
 */

/** The canonical platform address value, as a `Workflow.address()` field stores it. */
export interface AddressStructInput {
  street1?: string
  street2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  name?: string
  residential?: 'unknown' | 'yes' | 'no'
}

/** ShipStation's `address` shape. */
export interface ShipstationAddress {
  name: string
  phone: string
  company_name?: string
  address_line1: string
  address_line2?: string
  city_locality: string
  state_province: string
  postal_code: string
  country_code: string
  address_residential_indicator: 'unknown' | 'yes' | 'no'
}

/**
 * Map an `AddressStruct` plus its sibling phone onto ShipStation's address.
 *
 * `address_line3` is intentionally unused: the platform struct has two street
 * lines and inventing a third mapping would be guesswork.
 *
 * 🛑 Never concatenate a person and a company into `name`. A merged
 * "Acme Corp - Jane Smith" cannot be split back out, which makes it the one
 * irreversible mistake available here. If a caller has both, it picks one
 * deliberately before calling this.
 */
export function toShipstationAddress(
  address: AddressStructInput | undefined,
  phone: string | undefined
): ShipstationAddress {
  const a = address ?? {}
  return {
    name: (a.name ?? '').trim(),
    phone: (phone ?? '').trim(),
    address_line1: (a.street1 ?? '').trim(),
    address_line2: emptyToUndefined(a.street2),
    city_locality: (a.city ?? '').trim(),
    state_province: (a.state ?? '').trim(),
    postal_code: (a.zipCode ?? '').trim(),
    country_code: (a.country ?? '').trim().toUpperCase(),
    // `unknown` is ShipStation's own default and a real state, distinct from
    // "no". Never coerce an unanswered indicator to a residential/commercial
    // claim: it drives a carrier surcharge.
    address_residential_indicator: a.residential ?? 'unknown',
  }
}

/**
 * The fields ShipStation requires on an address, with a friendly name for each.
 * Used to fail early with a message naming what is missing, rather than letting
 * ShipStation return a 400 the workflow author cannot act on.
 */
const REQUIRED_ADDRESS_FIELDS: [keyof ShipstationAddress, string][] = [
  ['name', 'name'],
  ['phone', 'phone'],
  ['address_line1', 'street address'],
  ['city_locality', 'city'],
  ['state_province', 'state or province'],
  ['postal_code', 'postal code'],
  ['country_code', 'country'],
]

/** Names the missing required parts of an address, or an empty array. */
export function missingAddressFields(address: ShipstationAddress): string[] {
  return REQUIRED_ADDRESS_FIELDS.filter(([key]) => !String(address[key] ?? '').trim()).map(
    ([, label]) => label
  )
}

/** One row of the block's packages array. */
export interface PackageRowInput {
  weightValue?: number
  weightUnit?: string
  length?: number
  width?: number
  height?: number
  dimensionUnit?: string
  packageCode?: string
  insuredValue?: number
  insuredCurrency?: string
  externalPackageId?: string
  contentDescription?: string
  reference1?: string
  reference2?: string
  reference3?: string
}

/** ShipStation's `package` shape. */
export interface ShipstationPackage {
  package_code?: string
  weight: { value: number; unit: string }
  dimensions?: { unit: string; length: number; width: number; height: number }
  insured_value?: { amount: number; currency: string }
  external_package_id?: string
  content_description?: string
  label_messages?: { reference1: string; reference2: string; reference3: string }
}

/**
 * Map one package row.
 *
 * Two groups on ShipStation's side are all-or-nothing and are enforced here
 * rather than sent as partials:
 *
 * - `dimensions` requires `unit`, `length`, `width` AND `height`. A box with a
 *   length and no height is not a smaller request, it is a rejected one.
 * - `label_messages` requires all three of `reference1/2/3`.
 *
 * `weight` is the only field ShipStation requires on a package.
 */
export function toShipstationPackage(row: PackageRowInput): ShipstationPackage {
  const pkg: ShipstationPackage = {
    weight: { value: Number(row.weightValue ?? 0), unit: row.weightUnit ?? 'ounce' },
  }

  if (row.packageCode) pkg.package_code = row.packageCode

  const hasAllDimensions =
    isPositive(row.length) && isPositive(row.width) && isPositive(row.height) && !!row.dimensionUnit
  if (hasAllDimensions) {
    pkg.dimensions = {
      unit: row.dimensionUnit as string,
      length: Number(row.length),
      width: Number(row.width),
      height: Number(row.height),
    }
  }

  if (isPositive(row.insuredValue)) {
    pkg.insured_value = {
      amount: Number(row.insuredValue),
      currency: (row.insuredCurrency ?? 'usd').toLowerCase(),
    }
  }

  if (row.externalPackageId) pkg.external_package_id = row.externalPackageId
  if (row.contentDescription) pkg.content_description = row.contentDescription

  const references = [row.reference1, row.reference2, row.reference3]
  if (references.every((reference) => !!reference && reference.trim())) {
    pkg.label_messages = {
      reference1: row.reference1 as string,
      reference2: row.reference2 as string,
      reference3: row.reference3 as string,
    }
  }

  return pkg
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = (value ?? '').trim()
  return trimmed ? trimmed : undefined
}

function isPositive(value: number | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
