// src/tools/send-ms-teams-channel-message.tool.server.ts

import { graphApi } from '../blocks/ms-teams/shared/ms-teams-api'
import { getMsTeamsConnection } from './shared/connection'

interface SendMsTeamsChannelMessageInput {
  teamId: string
  channelId: string
  contentType?: 'text' | 'html'
  content: string
}

interface SendMsTeamsChannelMessageOutput {
  messageId: string
  webUrl: string | null
  createdAt: string
}

interface GraphMessageResponse {
  id?: string
  webUrl?: string
  createdDateTime?: string
}

export default async function sendMsTeamsChannelMessage(
  input: SendMsTeamsChannelMessageInput
): Promise<SendMsTeamsChannelMessageOutput> {
  const { token } = getMsTeamsConnection()

  const result = await graphApi<GraphMessageResponse>(
    'POST',
    `/teams/${input.teamId}/channels/${input.channelId}/messages`,
    token,
    {
      version: 'beta',
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
    webUrl: result.webUrl ? String(result.webUrl) : null,
    createdAt: String(result.createdDateTime ?? ''),
  }
}
