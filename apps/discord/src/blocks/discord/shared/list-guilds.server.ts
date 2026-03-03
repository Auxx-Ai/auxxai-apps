// src/blocks/discord/shared/list-guilds.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { discordApi, throwConnectionNotFound } from './discord-api'

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
}

export default async function listGuilds(): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const guilds = await discordApi<DiscordGuild[]>('/users/@me/guilds', token)

  return guilds
    .map((g) => ({ label: g.name, value: g.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
