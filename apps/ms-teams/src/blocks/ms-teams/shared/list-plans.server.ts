// src/blocks/ms-teams/shared/list-plans.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { graphApi, throwConnectionNotFound } from './ms-teams-api'

interface MsPlan {
  id: string
  title: string
}

export default async function listPlans(
  groupId: string
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const response = await graphApi<{ value: MsPlan[] }>(
    'GET',
    `/groups/${groupId}/planner/plans`,
    token
  )

  return (response.value ?? [])
    .map((p) => ({ label: p.title, value: p.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
