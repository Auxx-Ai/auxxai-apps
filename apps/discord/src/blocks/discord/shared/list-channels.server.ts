// src/blocks/discord/shared/list-channels.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { discordApi, throwConnectionNotFound } from './discord-api'

interface DiscordChannel {
  id: string
  name: string
  type: number
  parent_id: string | null
}

// Discord channel types
const GUILD_TEXT = 0
const GUILD_VOICE = 2
const GUILD_CATEGORY = 4

const TYPE_LABELS: Record<number, string> = {
  [GUILD_TEXT]: 'Text',
  [GUILD_VOICE]: 'Voice',
  [GUILD_CATEGORY]: 'Category',
}

export default async function listChannels(
  guildId: string,
  filterType?: 'all' | 'text' | 'voice' | 'category'
): Promise<{ label: string; value: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const token = connection.value
  const channels = await discordApi<DiscordChannel[]>(`/guilds/${guildId}/channels`, token)

  const typeFilter =
    filterType === 'text'
      ? GUILD_TEXT
      : filterType === 'voice'
        ? GUILD_VOICE
        : filterType === 'category'
          ? GUILD_CATEGORY
          : undefined

  return channels
    .filter((ch) => {
      if (typeFilter !== undefined) return ch.type === typeFilter
      return [GUILD_TEXT, GUILD_VOICE, GUILD_CATEGORY].includes(ch.type)
    })
    .map((ch) => {
      const prefix = ch.type === GUILD_TEXT ? '#' : ch.type === GUILD_VOICE ? '🔊 ' : '📁 '
      const suffix = TYPE_LABELS[ch.type] ? ` (${TYPE_LABELS[ch.type]})` : ''
      return { label: `${prefix}${ch.name}${suffix}`, value: ch.id }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}
