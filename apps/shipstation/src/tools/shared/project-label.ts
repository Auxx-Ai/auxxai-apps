// src/tools/shared/project-label.ts

/**
 * Projection from a raw ShipStation V2 label into the shape tools return.
 *
 * Two facts from the live probe drive this file:
 *
 * 1. A multi-package label carries N distinct tracking numbers — there is no
 *    "master plus N children". The label's own `tracking_number` equals the
 *    package with `sequence: 1`, which was returned LAST in the array. So the
 *    master is identified by equality and display is ordered by `sequence`,
 *    never by array position.
 * 2. A label's `tracking_status` is a label-level value that disagreed with the
 *    carrier's own tracking response, and voided labels still reported
 *    `in_transit`. It is therefore never copied onto individual packages.
 */

/** A package as it appears on a LABEL. Its `package_id` is numeric. */
export interface RawLabelPackage {
  package_id?: number | string
  sequence?: number
  tracking_number?: string
  weight?: { value?: number; unit?: string }
  dimensions?: { length?: number; width?: number; height?: number; unit?: string }
}

export interface RawLabel {
  label_id: string
  shipment_id?: string
  external_order_id?: string | null
  carrier_id?: string
  carrier_code?: string
  service_code?: string
  tracking_number?: string
  tracking_status?: string
  label_status?: string
  voided?: boolean
  voided_at?: string | null
  is_return_label?: boolean
  created_at?: string
  ship_date?: string
  packages?: RawLabelPackage[]
}

export interface ProjectedPackage {
  packageId: string
  sequence: number | null
  trackingNumber: string | null
  isMaster: boolean
  weight: { value: number; unit: string } | null
  dimensions: { length: number; width: number; height: number; unit: string } | null
}

export interface ProjectedLabel {
  labelId: string
  shipmentId: string | null
  externalOrderId: string | null
  carrierCode: string | null
  serviceCode: string | null
  masterTrackingNumber: string | null
  labelStatus: string | null
  trackingStatus: string | null
  voided: boolean
  voidedAt: string | null
  isReturnLabel: boolean
  createdAt: string | null
  shipDate: string | null
  packageCount: number
  packages: ProjectedPackage[]
}

function projectPackage(
  pkg: RawLabelPackage,
  masterTrackingNumber: string | null
): ProjectedPackage {
  const trackingNumber = pkg.tracking_number ?? null
  const weight =
    typeof pkg.weight?.value === 'number'
      ? { value: pkg.weight.value, unit: pkg.weight.unit ?? '' }
      : null
  const d = pkg.dimensions
  const dimensions =
    d && typeof d.length === 'number' && typeof d.width === 'number' && typeof d.height === 'number'
      ? { length: d.length, width: d.width, height: d.height, unit: d.unit ?? '' }
      : null

  return {
    // Label packages are identified label-scoped. A tracking number, an array
    // index, and the shipment-level `package_id` ('se-3' on every row) are all
    // unusable as identity. Kept as a string; `se-*` ids must never be coerced.
    packageId: pkg.package_id === undefined ? '' : String(pkg.package_id),
    sequence: typeof pkg.sequence === 'number' ? pkg.sequence : null,
    trackingNumber,
    isMaster: Boolean(
      trackingNumber && masterTrackingNumber && trackingNumber === masterTrackingNumber
    ),
    weight,
    dimensions,
  }
}

export function projectLabel(label: RawLabel): ProjectedLabel {
  const masterTrackingNumber = label.tracking_number ?? null
  const packages = (label.packages ?? []).map((pkg) => projectPackage(pkg, masterTrackingNumber))

  // Present by sequence ascending; rows without a sequence sort last, stably.
  packages.sort((a, b) => {
    if (a.sequence === b.sequence) return 0
    if (a.sequence === null) return 1
    if (b.sequence === null) return -1
    return a.sequence - b.sequence
  })

  return {
    labelId: label.label_id,
    shipmentId: label.shipment_id ?? null,
    externalOrderId: label.external_order_id ?? null,
    carrierCode: label.carrier_code ?? null,
    serviceCode: label.service_code ?? null,
    masterTrackingNumber,
    labelStatus: label.label_status ?? null,
    trackingStatus: label.tracking_status ?? null,
    voided: Boolean(label.voided),
    voidedAt: label.voided_at ?? null,
    isReturnLabel: Boolean(label.is_return_label),
    createdAt: label.created_at ?? null,
    shipDate: label.ship_date ?? null,
    packageCount: packages.length,
    packages,
  }
}

/** A label without its per-box weights and dimensions, for list responses. */
export interface ProjectedLabelSummary extends Omit<ProjectedLabel, 'packages'> {
  /** Every box's tracking number, ordered by sequence. */
  trackingNumbers: string[]
}

/**
 * List-shaped projection. Carries every tracking number — they are the point of
 * this app — but drops the per-box weight and dimension objects, which are
 * detail-tool depth and swamp a multi-row response. Use `get_shipstation_label`
 * or `get_shipstation_shipment_packages` for those.
 */
export function projectLabelSummary(label: RawLabel): ProjectedLabelSummary {
  const { packages, ...rest } = projectLabel(label)
  return {
    ...rest,
    trackingNumbers: packages.map((p) => p.trackingNumber).filter((n): n is string => Boolean(n)),
  }
}
