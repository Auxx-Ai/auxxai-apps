// src/blocks/shipstation/shared/use-package-types.ts

import listPackageTypes from './list-package-types.server'
import { useShipstationData } from './use-shipstation-data'

/**
 * Options for the `packageCode` select inside the shared packages array.
 *
 * Called with NO carrier id, so it returns the account's own custom package
 * types from `GET /v2/packages`. That is deliberate: the packages array renders
 * in `shipment.create`, `shipment.update`, `label.create` (scratch mode) and
 * `rate.getMany`, and in all four the author is describing boxes and has
 * frequently not chosen a carrier yet. A carrier-scoped loader has nothing to
 * key on at that point and renders an empty select, which is what the first
 * three resource panels each worked around differently.
 *
 * Carrier-specific codes are still reachable two ways: bind one from
 * `carrier.getPackageTypes` on an upstream node (every render site sets
 * `acceptsVariables`), or leave the field empty for the carrier default.
 *
 * `listPackageTypes` also accepts a carrier id and merges both sources; pass
 * one here if a panel ever has a carrier selected at the point the array
 * renders.
 */
export function usePackageTypes(enabled = true) {
  return useShipstationData('packageTypes', () => listPackageTypes(), { enabled })
}
