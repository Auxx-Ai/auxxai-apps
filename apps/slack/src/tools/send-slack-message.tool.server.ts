// src/tools/send-slack-message.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'

interface SendSlackMessageInput {
  to: { kind: 'channel' | 'user'; id: string }
  text: string
  threadTs?: string
}

interface SendSlackMessageOutput {
  channelId: string
  ts: string
  permalink: string | null
}

export default async function sendSlackMessage(
  input: SendSlackMessageInput
): Promise<SendSlackMessageOutput> {
  // Re-check the zod .refine() the JSON Schema converter strips.
  if (input.to.kind === 'user' && input.threadTs) {
    const err = new Error('threadTs is only valid when to.kind === "channel".') as Error & {
      code: string
    }
    err.code = 'INVALID_INPUT'
    throw err
  }

  const { token } = getSlackConnection()

  // Resolve target channel id. For DMs, open the conversation to get the channel id.
  let channelId = input.to.id
  if (input.to.kind === 'user') {
    const conversation = await slackApi('conversations.open', token, { users: input.to.id })
    const channel = conversation.channel as unknown as { id?: string } | undefined
    if (!channel?.id) {
      const err = new Error(`Could not open DM channel with user: ${input.to.id}`) as Error & {
        code: string
      }
      err.code = 'DM_OPEN_FAILED'
      throw err
    }
    channelId = channel.id
  }

  const result = await slackApi('chat.postMessage', token, {
    channel: channelId,
    text: input.text,
    ...(input.threadTs ? { thread_ts: input.threadTs } : {}),
  })

  const ts = result.ts ?? ''
  return {
    channelId,
    ts,
    permalink: await fetchPermalink(token, channelId, ts),
  }
}

async function fetchPermalink(token: string, channel: string, ts: string): Promise<string | null> {
  if (!ts) return null
  try {
    const response = await slackApi('chat.getPermalink', token, { channel, message_ts: ts })
    // biome-ignore lint/suspicious/noExplicitAny: chat.getPermalink dynamic shape.
    const permalink = (response as any)?.permalink
    return typeof permalink === 'string' ? permalink : null
  } catch {
    return null
  }
}
