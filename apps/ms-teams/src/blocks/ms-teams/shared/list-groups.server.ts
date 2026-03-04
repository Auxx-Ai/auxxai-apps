// src/blocks/ms-teams/shared/list-groups.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { graphApi, throwConnectionNotFound } from './ms-teams-api'

interface MsGroup {
  id: string
  displayName: string
}

export default async function listGroups(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const response = await graphApi<{ value: MsGroup[] }>('GET', '/me/joinedTeams', token)

  return (response.value ?? [])
    .map((g) => ({ label: g.displayName, value: g.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
