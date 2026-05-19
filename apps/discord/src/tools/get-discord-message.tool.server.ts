// src/tools/get-discord-message.tool.server.ts

import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'
import { type MappedMessage, mapMessage } from './shared/map-message'

interface GetDiscordMessageInput {
  channelId: string
  messageId: string
}

export default async function getDiscordMessage(
  input: GetDiscordMessageInput
): Promise<MappedMessage> {
  const token = getDiscordToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await discordApi<any>(
    `/channels/${input.channelId}/messages/${input.messageId}`,
    token
  )
  return mapMessage(raw)
}
