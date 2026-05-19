// src/tools/get-slack-message-thread.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'
import { type MappedThreadMessage, mapThreadMessage } from './shared/map-message'

interface GetSlackMessageThreadInput {
  channelId: string
  threadTs: string
}

interface GetSlackMessageThreadOutput {
  parent: MappedThreadMessage
  replies: MappedThreadMessage[]
}

export default async function getSlackMessageThread(
  input: GetSlackMessageThreadInput
): Promise<GetSlackMessageThreadOutput> {
  const { token } = getSlackConnection()
  const response = await slackApi('conversations.replies', token, {
    channel: input.channelId,
    ts: input.threadTs,
    limit: 200,
  })

  // biome-ignore lint/suspicious/noExplicitAny: conversations.replies dynamic shape.
  const messages = ((response as any)?.messages ?? []) as unknown[]
  if (messages.length === 0) {
    const err = new Error(`Thread not found: ${input.channelId}/${input.threadTs}`) as Error & {
      code: string
    }
    err.code = 'NOT_FOUND'
    throw err
  }

  const [parent, ...replies] = messages
  return {
    parent: mapThreadMessage(parent),
    replies: replies.map(mapThreadMessage),
  }
}
