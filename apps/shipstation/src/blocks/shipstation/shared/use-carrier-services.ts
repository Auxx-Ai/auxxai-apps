// src/blocks/shipstation/shared/use-carrier-services.ts

import listServices from './list-services.server'
import { useShipstationData } from './use-shipstation-data'

/**
 * Options for a `serviceCode` select, scoped to the carrier chosen beside it.
 *
 * Carrier-scoped, unlike {@link usePackageTypes}, and the difference is
 * deliberate. Package types render inside the packages array, where the author
 * is describing boxes and frequently has not picked a carrier yet, so scoping
 * there would show an empty select. Service code sits directly under the
 * Carrier picker in the same section — if it is answerable at all, a carrier
 * has been chosen.
 *
 * The cache key carries the carrier id, so switching carrier reloads rather
 * than leaving the previous carrier's services on screen. An empty carrier id
 * disables the load entirely; `listServices` also short circuits on one, so a
 * blank never reaches `/v2/carriers//services`.
 */
export function useCarrierServices(carrierId: string | undefined, enabled = true) {
  const id = (carrierId ?? '').trim()
  return useShipstationData(`services:${id}`, () => listServices(id), {
    enabled: enabled && id !== '',
  })
}
