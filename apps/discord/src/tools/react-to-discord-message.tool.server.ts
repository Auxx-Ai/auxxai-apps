// src/tools/react-to-discord-message.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'
import { encodeEmoji } from './shared/encode-emoji'

interface ReactToDiscordMessageInput {
  channelId: string
  messageId: string
  emoji: string
}

interface ReactToDiscordMessageOutput {
  success: true
}

export default async function reactToDiscordMessage(
  input: ReactToDiscordMessageInput
): Promise<ReactToDiscordMessageOutput> {
  const emoji = input.emoji?.trim() ?? ''
  if (!emoji) {
    throw new BlockRuntimeError('emoji is required.', 'INVALID_INPUT')
  }

  const token = getDiscordToken()
  await discordApi(
    `/channels/${input.channelId}/messages/${input.messageId}/reactions/${encodeEmoji(emoji)}/@me`,
    token,
    { method: 'PUT' }
  )

  return { success: true }
}
