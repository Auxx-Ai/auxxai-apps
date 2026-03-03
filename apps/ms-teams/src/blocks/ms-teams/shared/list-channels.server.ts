// src/blocks/ms-teams/shared/list-channels.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { graphApi, throwConnectionNotFound } from './ms-teams-api'

interface MsChannel {
  id: string
  displayName: string
  membershipType: string
}

export default async function listChannels(
  teamId: string
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const response = await graphApi<{ value: MsChannel[] }>('GET', `/teams/${teamId}/channels`, token)

  return (response.value ?? [])
    .map((ch) => {
      const suffix = ch.membershipType === 'private' ? ' (Private)' : ''
      return { label: `${ch.displayName}${suffix}`, value: ch.id }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}
