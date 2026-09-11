// src/blocks/shipstation/shared/list-services.server.ts

import { shipstationApi } from '../../../tools/shared/shipstation-api'
import { getShipstationApiKey } from '../../../tools/shared/connection'

interface ServiceListResponse {
  services?: { service_code?: string; name?: string }[]
}

/**
 * The shipping services one carrier offers, for a panel's service picker.
 *
 * Carrier-scoped: ShipStation has no account-wide service list, only
 * `GET /v2/carriers/{carrier_id}/services`, so the caller must already know
 * which carrier the author picked. An empty `carrierId` returns an empty list
 * rather than calling the API, because the panel renders the service select
 * before the carrier select has been answered.
 *
 * The value is the `service_code` (e.g. `usps_media_mail`), which is what every
 * ShipStation request wants; `service_id` does not exist on this resource.
 */
export default async function listServices(
  carrierId: string
): Promise<{ value: string; label: string }[]> {
  if (!carrierId) return []

  const apiKey = getShipstationApiKey()
  const result = await shipstationApi<ServiceListResponse>(
    `/carriers/${encodeURIComponent(carrierId)}/services`,
    apiKey
  )

  return (result.services ?? [])
    .filter((service) => !!service.service_code)
    .map((service) => ({
      value: String(service.service_code),
      label: service.name || String(service.service_code),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
