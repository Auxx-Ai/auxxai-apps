// src/tools/get-slack-channel.tool.server.ts

import { slackApi } from '../blocks/slack/shared/slack-api'
import { getSlackConnection } from './shared/connection'
import { type MappedSlackChannelFull, mapChannelFull } from './shared/map-channel'

interface GetSlackChannelInput {
  channelId: string
}

export default async function getSlackChannel(
  input: GetSlackChannelInput
): Promise<MappedSlackChannelFull> {
  const { token } = getSlackConnection()
  const info = await slackApi('conversations.info', token, { channel: input.channelId })
  if (!info.channel) {
    const err = new Error(`Channel not found: ${input.channelId}`) as Error & { code: string }
    err.code = 'NOT_FOUND'
    throw err
  }
  return mapChannelFull(info.channel)
}
