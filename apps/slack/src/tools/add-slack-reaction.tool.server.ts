// src/tools/add-slack-reaction.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'

interface AddSlackReactionInput {
  channelId: string
  ts: string
  emoji: string
}

interface AddSlackReactionOutput {
  ok: true
}

export default async function addSlackReaction(
  input: AddSlackReactionInput
): Promise<AddSlackReactionOutput> {
  const { token } = getSlackConnection()
  const emoji = input.emoji.trim().replace(/^:|:$/g, '')
  await slackApi('reactions.add', token, {
    channel: input.channelId,
    timestamp: input.ts,
    name: emoji,
  })
  return { ok: true }
}
