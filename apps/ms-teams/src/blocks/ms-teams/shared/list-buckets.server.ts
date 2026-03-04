// src/blocks/ms-teams/shared/list-buckets.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { graphApi, throwConnectionNotFound } from './ms-teams-api'

interface MsBucket {
  id: string
  name: string
}

export default async function listBuckets(
  planId: string
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const response = await graphApi<{ value: MsBucket[] }>(
    'GET',
    `/planner/plans/${planId}/buckets`,
    token
  )

  return (response.value ?? [])
    .map((b) => ({ label: b.name, value: b.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
