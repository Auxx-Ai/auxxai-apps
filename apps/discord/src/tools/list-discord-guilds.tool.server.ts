// src/tools/list-discord-guilds.tool.server.ts

import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface GuildRow {
  guildId: string
  name: string
  iconUrl: string | null
  owner: boolean
}

interface ListDiscordGuildsOutput {
  guilds: GuildRow[]
}

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner?: boolean
}

const CDN = 'https://cdn.discordapp.com'

export default async function listDiscordGuilds(): Promise<ListDiscordGuildsOutput> {
  const token = getDiscordToken()
  const guilds = await discordApi<DiscordGuild[]>('/users/@me/guilds', token)

  return {
    guilds: guilds.map((g) => ({
      guildId: g.id,
      name: g.name,
      iconUrl: g.icon ? `${CDN}/icons/${g.id}/${g.icon}.png` : null,
      owner: Boolean(g.owner),
    })),
  }
}
