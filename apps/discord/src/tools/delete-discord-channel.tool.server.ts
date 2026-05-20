// src/tools/delete-discord-channel.tool.server.ts

import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface DeleteDiscordChannelInput {
  channelId: string
}

interface DeleteDiscordChannelOutput {
  deletedChannelId: string
  deletedChannelName: string
}

export default async function deleteDiscordChannel(
  input: DeleteDiscordChannelInput
): Promise<DeleteDiscordChannelOutput> {
  const token = getDiscordToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await discordApi<any>(`/channels/${input.channelId}`, token, {
    method: 'DELETE',
  })

  return {
    deletedChannelId: result.id ?? input.channelId,
    deletedChannelName: result.name ?? '',
  }
}
