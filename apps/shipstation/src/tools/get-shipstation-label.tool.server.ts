// src/tools/get-shipstation-label.tool.server.ts

import { getShipstationApiKey } from './shared/connection'
import { type RawLabel, projectLabel } from './shared/project-label'
import { shipstationApi } from './shared/shipstation-api'

interface GetShipstationLabelInput {
  labelId: string
}

export default async function getShipstationLabel(input: GetShipstationLabelInput) {
  const apiKey = getShipstationApiKey()
  const raw = await shipstationApi<RawLabel>(`/labels/${encodeURIComponent(input.labelId)}`, apiKey)

  return { label: projectLabel(raw) }
}
