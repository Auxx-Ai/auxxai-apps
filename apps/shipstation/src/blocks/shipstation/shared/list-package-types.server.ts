// src/blocks/shipstation/shared/list-package-types.server.ts

import { shipstationApi } from '../../../tools/shared/shipstation-api'
import { getShipstationApiKey } from '../../../tools/shared/connection'

interface PackageTypeListResponse {
  packages?: { package_code?: string; name?: string }[]
}

/** Carrier-provided entries are suffixed so they are distinguishable in one list. */
const CARRIER_PROVIDED_SUFFIX = ' (carrier)'

/**
 * Package types for a panel's `packageCode` picker.
 *
 * The carrier id is OPTIONAL, and that is the whole point of this signature.
 * The main consumer is the `packageCode` select inside the shared packages
 * array, which renders while the author is describing boxes — often before any
 * carrier has been chosen. A carrier-scoped-only loader has nothing to key on
 * there and renders an empty select.
 *
 * So there are two sources, and which ones are read depends on what is known:
 *
 * - Always `GET /v2/packages`, the account's own CUSTOM package types. It takes
 *   no parameters, so it works with nothing selected.
 * - Additionally `GET /v2/carriers/{carrier_id}/packages` when a carrier is
 *   known, for that carrier's standard types (flat rate boxes and the like).
 *
 * The two are merged and de-duplicated on `package_code`, which is the value
 * every ShipStation request actually takes. A custom type wins a collision: the
 * account defined it deliberately, and its dimensions are the ones that account
 * means. Carrier-provided entries are labelled `(carrier)` so an author can tell
 * the two apart in one list.
 *
 * Errors from either leg propagate. A carrier that cannot be read is a real
 * failure the author needs to see, not a reason to quietly show a short list.
 *
 * `carrier.getPackageTypes` is deliberately NOT this: that operation is about
 * one carrier and stays carrier-scoped.
 */
export default async function listPackageTypes(
  carrierId?: string
): Promise<{ value: string; label: string }[]> {
  const apiKey = getShipstationApiKey()
  const id = (carrierId ?? '').trim()

  const [custom, carrierProvided] = await Promise.all([
    shipstationApi<PackageTypeListResponse>('/packages', apiKey),
    id
      ? shipstationApi<PackageTypeListResponse>(
          `/carriers/${encodeURIComponent(id)}/packages`,
          apiKey
        )
      : Promise.resolve({} as PackageTypeListResponse),
  ])

  const options = new Map<string, { value: string; label: string }>()

  // Custom first, so a collision resolves in favour of the account's own type.
  for (const packageType of custom.packages ?? []) {
    if (!packageType.package_code) continue
    const value = String(packageType.package_code)
    options.set(value, { value, label: packageType.name || value })
  }

  for (const packageType of carrierProvided.packages ?? []) {
    if (!packageType.package_code) continue
    const value = String(packageType.package_code)
    if (options.has(value)) continue
    options.set(value, {
      value,
      label: `${packageType.name || value}${CARRIER_PROVIDED_SUFFIX}`,
    })
  }

  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label))
}
