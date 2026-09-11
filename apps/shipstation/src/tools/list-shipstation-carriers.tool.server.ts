// src/tools/list-shipstation-carriers.tool.server.ts

import { getShipstationApiKey } from './shared/connection'
import { shipstationApi } from './shared/shipstation-api'

interface RawCarrier {
  carrier_id: string
  carrier_code?: string
  friendly_name?: string
  nickname?: string
}

export default async function listShipstationCarriers() {
  const apiKey = getShipstationApiKey()
  const data = await shipstationApi<{ carriers?: RawCarrier[] }>('/carriers', apiKey)
  const carriers = (data.carriers ?? []).map((c) => ({
    carrierId: c.carrier_id,
    carrierCode: c.carrier_code ?? null,
    friendlyName: c.friendly_name ?? null,
    nickname: c.nickname ?? null,
  }))

  return { carriers, count: carriers.length }
}
