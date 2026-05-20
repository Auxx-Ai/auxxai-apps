// src/tools/create-discord-channel.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface CreateDiscordChannelInput {
  guildId: string
  name: string
  type?: 'text' | 'voice' | 'category'
  topic?: string
  parentId?: string
  nsfw?: boolean
}

interface CreateDiscordChannelOutput {
  channelId: string
  channelName: string
  channelType: string
}

const CHANNEL_TYPE_MAP: Record<string, number> = {
  text: 0,
  voice: 2,
  category: 4,
}

const CHANNEL_TYPE_LABELS: Record<number, string> = {
  0: 'Text',
  2: 'Voice',
  4: 'Category',
}

export default async function createDiscordChannel(
  input: CreateDiscordChannelInput
): Promise<CreateDiscordChannelOutput> {
  const name = input.name?.trim()
  if (!name) {
    throw new BlockRuntimeError('Channel name is required.', 'INVALID_INPUT')
  }

  const token = getDiscordToken()
  const type = CHANNEL_TYPE_MAP[input.type ?? 'text'] ?? 0

  const body: Record<string, unknown> = { name, type }
  if (input.topic?.trim()) body.topic = input.topic.trim()
  if (input.parentId) body.parent_id = input.parentId
  if (input.nsfw) body.nsfw = true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await discordApi<any>(`/guilds/${input.guildId}/channels`, token, {
    method: 'POST',
    body,
  })

  return {
    channelId: result.id ?? '',
    channelName: result.name ?? name,
    channelType: CHANNEL_TYPE_LABELS[result.type as number] ?? String(result.type),
  }
}
