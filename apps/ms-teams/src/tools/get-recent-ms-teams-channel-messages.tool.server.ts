// src/tools/get-recent-ms-teams-channel-messages.tool.server.ts

import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'
import { type MappedMsTeamsChannelMessage, mapChannelMessage } from './shared/map-message'

interface GetRecentMsTeamsChannelMessagesInput {
  teamId: string
  channelId: string
  limit?: number
}

interface GetRecentMsTeamsChannelMessagesOutput {
  messages: MappedMsTeamsChannelMessage[]
}

interface GraphMessageList {
  value?: unknown[]
}

export default async function getRecentMsTeamsChannelMessages(
  input: GetRecentMsTeamsChannelMessagesInput
): Promise<GetRecentMsTeamsChannelMessagesOutput> {
  const { token } = getMsTeamsConnection()
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50)

  const response = await graphApi<GraphMessageList>(
    'GET',
    `/teams/${input.teamId}/channels/${input.channelId}/messages?$top=${limit}`,
    token,
    { version: 'beta' }
  )

  const raw = response.value ?? []
  return { messages: raw.map(mapChannelMessage) }
}
