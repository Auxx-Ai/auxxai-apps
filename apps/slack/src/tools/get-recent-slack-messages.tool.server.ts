// src/tools/get-recent-slack-messages.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'
import { type MappedSlackMessage, mapMessage } from './shared/map-message'

interface GetRecentSlackMessagesInput {
  channelId: string
  limit?: number
}

interface GetRecentSlackMessagesOutput {
  messages: MappedSlackMessage[]
}

export default async function getRecentSlackMessages(
  input: GetRecentSlackMessagesInput
): Promise<GetRecentSlackMessagesOutput> {
  const { token } = getSlackConnection()
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100)

  const response = await slackApi('conversations.history', token, {
    channel: input.channelId,
    limit,
  })

  // biome-ignore lint/suspicious/noExplicitAny: conversations.history dynamic shape.
  const messages = ((response as any)?.messages ?? []) as unknown[]
  return { messages: messages.map(mapMessage) }
}
