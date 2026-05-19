// src/tools/reply-in-slack-thread.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'

interface ReplyInSlackThreadInput {
  channelId: string
  threadTs: string
  text: string
}

interface ReplyInSlackThreadOutput {
  ts: string
  permalink: string | null
}

export default async function replyInSlackThread(
  input: ReplyInSlackThreadInput
): Promise<ReplyInSlackThreadOutput> {
  const { token } = getSlackConnection()

  const result = await slackApi('chat.postMessage', token, {
    channel: input.channelId,
    text: input.text,
    thread_ts: input.threadTs,
  })

  const ts = result.ts ?? ''
  let permalink: string | null = null
  if (ts) {
    try {
      const response = await slackApi('chat.getPermalink', token, {
        channel: input.channelId,
        message_ts: ts,
      })
      // biome-ignore lint/suspicious/noExplicitAny: chat.getPermalink dynamic shape.
      const link = (response as any)?.permalink
      permalink = typeof link === 'string' ? link : null
    } catch {
      permalink = null
    }
  }

  return { ts, permalink }
}
