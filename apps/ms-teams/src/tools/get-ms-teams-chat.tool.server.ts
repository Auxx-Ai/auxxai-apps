// src/tools/get-ms-teams-chat.tool.server.ts

import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsChat, mapChat } from './shared/map-chat'

interface GetMsTeamsChatInput {
  chatId: string
}

export default async function getMsTeamsChat(
  input: GetMsTeamsChatInput
): Promise<MappedMsTeamsChat> {
  const { token } = getMsTeamsConnection()
  const raw = await graphApi<unknown>('GET', `/chats/${input.chatId}?$expand=members`, token)
  return mapChat(raw)
}
