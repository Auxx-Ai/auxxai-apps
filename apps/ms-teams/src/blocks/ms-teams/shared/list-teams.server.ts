// src/blocks/ms-teams/shared/list-teams.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { graphApi, throwConnectionNotFound } from './ms-teams-api'

interface MsTeam {
  id: string
  displayName: string
}

export default async function listTeams(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const response = await graphApi<{ value: MsTeam[] }>('GET', '/me/joinedTeams', token)

  return (response.value ?? [])
    .map((t) => ({ label: t.displayName, value: t.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
