// src/tools/update-discord-channel.tool.server.ts

import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface UpdateDiscordChannelInput {
  channelId: string
  name?: string
  topic?: string
  parentId?: string
  nsfw?: boolean
}

interface UpdateDiscordChannelOutput {
  channelId: string
  channelName: string
}

export default async function updateDiscordChannel(
  input: UpdateDiscordChannelInput
): Promise<UpdateDiscordChannelOutput> {
  const token = getDiscordToken()
  const body: Record<string, unknown> = {}
  if (input.name?.trim()) body.name = input.name.trim()
  if (input.topic !== undefined && input.topic !== '') body.topic = input.topic.trim()
  if (input.parentId) body.parent_id = input.parentId
  if (input.nsfw !== undefined) body.nsfw = input.nsfw

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await discordApi<any>(`/channels/${input.channelId}`, token, {
    method: 'PATCH',
    body,
  })

  return {
    channelId: result.id ?? '',
    channelName: result.name ?? '',
  }
}
