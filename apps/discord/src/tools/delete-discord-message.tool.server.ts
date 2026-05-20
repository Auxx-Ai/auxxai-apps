// src/tools/delete-discord-message.tool.server.ts

import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface DeleteDiscordMessageInput {
  channelId: string
  messageId: string
}

interface DeleteDiscordMessageOutput {
  deletedMessageId: string
  deleted: boolean
}

export default async function deleteDiscordMessage(
  input: DeleteDiscordMessageInput
): Promise<DeleteDiscordMessageOutput> {
  const token = getDiscordToken()
  await discordApi(`/channels/${input.channelId}/messages/${input.messageId}`, token, {
    method: 'DELETE',
  })

  return {
    deletedMessageId: input.messageId,
    deleted: true,
  }
}
