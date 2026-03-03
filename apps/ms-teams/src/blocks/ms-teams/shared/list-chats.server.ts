// src/blocks/ms-teams/shared/list-chats.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { graphApi, throwConnectionNotFound } from './ms-teams-api'

interface MsChatMember {
  displayName: string | null
}

interface MsChat {
  id: string
  topic: string | null
  chatType: string
  members?: MsChatMember[]
}

export default async function listChats(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const response = await graphApi<{ value: MsChat[] }>(
    'GET',
    '/me/chats?$expand=members&$top=50',
    token
  )

  return (response.value ?? []).map((chat) => {
    let label = chat.topic
    if (!label) {
      const memberNames = (chat.members ?? [])
        .map((m) => m.displayName)
        .filter(Boolean)
        .slice(0, 3)
      label = memberNames.length > 0 ? memberNames.join(', ') : `Chat (${chat.chatType})`
    }
    return { label, value: chat.id }
  })
}
