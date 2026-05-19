// src/tools/list-ms-teams-chats.tool.server.ts

import { graphPaginatedGet } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsChatSummary, mapChatSummary } from './shared/map-chat'

interface ListMsTeamsChatsOutput {
  chats: MappedMsTeamsChatSummary[]
}

export default async function listMsTeamsChats(): Promise<ListMsTeamsChatsOutput> {
  const { token } = getMsTeamsConnection()
  const { items } = await graphPaginatedGet<unknown>('/me/chats', token, {
    returnAll: true,
  })

  return { chats: items.map(mapChatSummary) }
}
