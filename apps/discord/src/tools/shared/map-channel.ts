// src/tools/shared/map-channel.ts

/**
 * Tool-surface mapper for a Discord channel. Trims the raw Discord channel
 * object down to the fields the LLM reasons over — separate from the
 * workflow block's mapper, which returns flat-stringified JSON for variable
 * splicing. See plans/kopilot/apps/discord-overhaul.md §7.
 */

// Discord channel type constants.
const GUILD_TEXT = 0
const GUILD_VOICE = 2
const GUILD_CATEGORY = 4

export type ChannelType = 'text' | 'voice' | 'category' | 'other'

export function channelType(rawType: number): ChannelType {
  if (rawType === GUILD_TEXT) return 'text'
  if (rawType === GUILD_VOICE) return 'voice'
  if (rawType === GUILD_CATEGORY) return 'category'
  return 'other'
}

export interface MappedChannel {
  channelId: string
  name: string
  type: ChannelType
  topic: string | null
  parentId: string | null
  position: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapChannel(raw: any): MappedChannel {
  return {
    channelId: raw.id ?? '',
    name: raw.name ?? '',
    type: channelType(raw.type),
    topic: raw.topic ?? null,
    parentId: raw.parent_id ?? null,
    position: typeof raw.position === 'number' ? raw.position : 0,
  }
}

export interface MappedChannelDetail extends MappedChannel {
  guildId: string | null
  nsfw: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapChannelDetail(raw: any): MappedChannelDetail {
  return {
    ...mapChannel(raw),
    guildId: raw.guild_id ?? null,
    nsfw: Boolean(raw.nsfw),
  }
}
