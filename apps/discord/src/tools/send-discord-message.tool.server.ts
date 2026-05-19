// src/tools/send-discord-message.tool.server.ts

import { BlockRuntimeError } from '@auxx/sdk/shared'
import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface SendDiscordMessageInput {
  channelId: string
  content: string
  replyToMessageId?: string
  suppressEmbeds?: boolean
  suppressNotifications?: boolean
}

interface SendDiscordMessageOutput {
  messageId: string
  channelId: string
  content: string
  timestamp: string
  url: string
}

const SUPPRESS_EMBEDS = 1 << 2
const SUPPRESS_NOTIFICATIONS = 1 << 12

export default async function sendDiscordMessage(
  input: SendDiscordMessageInput
): Promise<SendDiscordMessageOutput> {
  // Re-check zod bounds the JSON Schema emit strips.
  const content = input.content?.trim() ?? ''
  if (content.length < 1 || content.length > 2000) {
    throw new BlockRuntimeError(
      'content must be 1-2000 characters after trimming.',
      'INVALID_INPUT'
    )
  }

  const token = getDiscordToken()
  const body: Record<string, unknown> = { content }

  if (input.replyToMessageId) {
    body.message_reference = { message_id: input.replyToMessageId }
  }

  let flags = 0
  if (input.suppressEmbeds) flags |= SUPPRESS_EMBEDS
  if (input.suppressNotifications) flags |= SUPPRESS_NOTIFICATIONS
  if (flags > 0) body.flags = flags

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await discordApi<any>(`/channels/${input.channelId}/messages`, token, {
    method: 'POST',
    body,
  })

  const messageId = result.id ?? ''
  const channelId = result.channel_id ?? input.channelId
  const guildId = result.guild_id as string | undefined
  const url = guildId
    ? `https://discord.com/channels/${guildId}/${channelId}/${messageId}`
    : `https://discord.com/channels/@me/${channelId}/${messageId}`

  return {
    messageId,
    channelId,
    content: result.content ?? '',
    timestamp: result.timestamp ?? '',
    url,
  }
}
