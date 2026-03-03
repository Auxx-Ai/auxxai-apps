// src/blocks/ms-teams/shared/list-members.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { graphApi, throwConnectionNotFound } from './ms-teams-api'

interface MsMember {
  id: string
  displayName: string
}

export default async function listMembers(
  groupId: string
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const response = await graphApi<{ value: MsMember[] }>('GET', `/groups/${groupId}/members`, token)

  return (response.value ?? [])
    .map((m) => ({ label: m.displayName, value: m.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
