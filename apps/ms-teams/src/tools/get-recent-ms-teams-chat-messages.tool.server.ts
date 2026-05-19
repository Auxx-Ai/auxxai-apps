// src/tools/get-recent-ms-teams-chat-messages.tool.server.ts

import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsChatMessage, mapChatMessage } from './shared/map-message'

interface GetRecentMsTeamsChatMessagesInput {
  chatId: string
  limit?: number
}

interface GetRecentMsTeamsChatMessagesOutput {
  messages: MappedMsTeamsChatMessage[]
}

interface GraphMessageList {
  value?: unknown[]
}

export default async function getRecentMsTeamsChatMessages(
  input: GetRecentMsTeamsChatMessagesInput
): Promise<GetRecentMsTeamsChatMessagesOutput> {
  const { token } = getMsTeamsConnection()
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50)

  const response = await graphApi<GraphMessageList>(
    'GET',
    `/chats/${input.chatId}/messages?$top=${limit}`,
    token
  )

  const raw = response.value ?? []
  return { messages: raw.map(mapChatMessage) }
}
