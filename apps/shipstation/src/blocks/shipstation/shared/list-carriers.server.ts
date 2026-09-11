// src/blocks/shipstation/shared/list-carriers.server.ts

import { shipstationApi } from '../../../tools/shared/shipstation-api'
import { getShipstationApiKey } from '../../../tools/shared/connection'

interface CarrierListResponse {
  carriers?: { carrier_id?: string; friendly_name?: string; nickname?: string }[]
}

/** Connected carriers, for the panel's carrier picker. */
export default async function listCarriers(): Promise<{ value: string; label: string }[]> {
  const apiKey = getShipstationApiKey()
  const result = await shipstationApi<CarrierListResponse>('/carriers', apiKey)

  return (result.carriers ?? [])
    .filter((carrier) => !!carrier.carrier_id)
    .map((carrier) => ({
      value: String(carrier.carrier_id),
      label: carrier.nickname || carrier.friendly_name || String(carrier.carrier_id),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
