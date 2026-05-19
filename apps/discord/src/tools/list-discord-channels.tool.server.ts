// src/tools/list-discord-channels.tool.server.ts

import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'
import { type MappedChannel, mapChannel } from './shared/map-channel'

interface ListDiscordChannelsInput {
  guildId: string
  filterType?: 'all' | 'text' | 'voice' | 'category'
}

interface ListDiscordChannelsOutput {
  channels: MappedChannel[]
}

export default async function listDiscordChannels(
  input: ListDiscordChannelsInput
): Promise<ListDiscordChannelsOutput> {
  const token = getDiscordToken()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await discordApi<any[]>(`/guilds/${input.guildId}/channels`, token)
  const channels = raw.map(mapChannel)

  const filter = input.filterType ?? 'all'
  const filtered = filter === 'all' ? channels : channels.filter((c) => c.type === filter)

  return { channels: filtered }
}
