// src/blocks/discord/shared/list-roles.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { discordApi, throwConnectionNotFound } from './discord-api'

interface DiscordRole {
  id: string
  name: string
  position: number
  managed: boolean
}

export default async function listRoles(
  guildId: string
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const roles = await discordApi<DiscordRole[]>(`/guilds/${guildId}/roles`, token)

  return roles
    .filter((r) => r.name !== '@everyone' && !r.managed)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ label: r.name, value: r.id }))
}
