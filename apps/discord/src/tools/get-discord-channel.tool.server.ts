// src/tools/get-discord-channel.tool.server.ts

import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'
import { type MappedChannelDetail, mapChannelDetail } from './shared/map-channel'

interface GetDiscordChannelInput {
  channelId: string
}

export default async function getDiscordChannel(
  input: GetDiscordChannelInput
): Promise<MappedChannelDetail> {
  const token = getDiscordToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await discordApi<any>(`/channels/${input.channelId}`, token)
  return mapChannelDetail(raw)
}
