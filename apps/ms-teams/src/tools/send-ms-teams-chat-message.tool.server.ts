// src/tools/send-ms-teams-chat-message.tool.server.ts

import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'

interface SendMsTeamsChatMessageInput {
  chatId: string
  contentType?: 'text' | 'html'
  content: string
}

interface SendMsTeamsChatMessageOutput {
  messageId: string
  createdAt: string
}

interface GraphMessageResponse {
  id?: string
  createdDateTime?: string
}

export default async function sendMsTeamsChatMessage(
  input: SendMsTeamsChatMessageInput
): Promise<SendMsTeamsChatMessageOutput> {
  const { token } = getMsTeamsConnection()

  const result = await graphApi<GraphMessageResponse>(
    'POST',
    `/chats/${input.chatId}/messages`,
    token,
    {
      body: {
        body: {
          contentType: input.contentType ?? 'text',
          content: input.content,
        },
      },
    }
  )

  return {
    messageId: String(result.id ?? ''),
    createdAt: String(result.createdDateTime ?? ''),
  }
}
