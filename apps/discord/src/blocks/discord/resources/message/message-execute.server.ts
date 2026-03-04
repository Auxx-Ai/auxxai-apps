// src/blocks/discord/resources/message/message-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { discordApi, discordPaginatedGet, throwConnectionNotFound } from '../../shared/discord-api'

export async function executeMessage(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'send':
      return sendMessage(token, input)
    case 'delete':
      return deleteMessage(token, input)
    case 'get':
      return getMessage(token, input)
    case 'getMany':
      return getManyMessages(token, input)
    case 'react':
      return reactToMessage(token, input)
    default:
      throw new Error(`Unknown message operation: ${operation}`)
  }
}

async function sendMessage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const channelId = input.sendChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'sendChannel', message: 'Select a channel.' }])

  const content = input.sendContent?.trim()
  if (!content)
    throw new BlockValidationError([
      { field: 'sendContent', message: 'Message content is required.' },
    ])

  const body: Record<string, unknown> = { content }

  if (input.sendTts) body.tts = true

  if (input.sendReplyTo?.trim()) {
    body.message_reference = { message_id: input.sendReplyTo.trim() }
  }

  // Build flags bitmask
  let flags = 0
  if (input.sendSuppressEmbeds) flags |= 1 << 2 // SUPPRESS_EMBEDS = 4
  if (input.sendSuppressNotifications) flags |= 1 << 12 // SUPPRESS_NOTIFICATIONS = 4096
  if (flags > 0) body.flags = flags

  const result = await discordApi<any>(`/channels/${channelId}/messages`, token, {
    method: 'POST',
    body,
  })

  return {
    messageId: result.id ?? '',
    channelId: result.channel_id ?? channelId,
    content: result.content ?? '',
    timestamp: result.timestamp ?? '',
  }
}

async function getMessage(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const channelId = input.getMessageChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'getMessageChannel', message: 'Select a channel.' }])

  const messageId = input.getMessageId?.trim()
  if (!messageId)
    throw new BlockValidationError([{ field: 'getMessageId', message: 'Message ID is required.' }])

  const result = await discordApi<any>(`/channels/${channelId}/messages/${messageId}`, token)

  return {
    messageId: result.id ?? '',
    content: result.content ?? '',
    authorId: result.author?.id ?? '',
    authorUsername: result.author?.username ?? '',
    timestamp: result.timestamp ?? '',
    messageData: result,
  }
}

async function getManyMessages(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const channelId = input.getManyMessageChannel
  if (!channelId)
    throw new BlockValidationError([
      { field: 'getManyMessageChannel', message: 'Select a channel.' },
    ])

  const returnAll = input.getManyMessageReturnAll ?? false
  const limit = input.getManyMessageLimit ?? 50

  const { items, truncated } = await discordPaginatedGet<any>(
    `/channels/${channelId}/messages`,
    token,
    {
      returnAll,
      limit,
      cursorParam: 'before',
      pageSize: 100,
    }
  )

  return {
    messages: items,
    totalCount: String(items.length),
    truncated: String(truncated),
  }
}

async function deleteMessage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const channelId = input.deleteMessageChannel
  if (!channelId)
    throw new BlockValidationError([
      { field: 'deleteMessageChannel', message: 'Select a channel.' },
    ])

  const messageId = input.deleteMessageId?.trim()
  if (!messageId)
    throw new BlockValidationError([
      { field: 'deleteMessageId', message: 'Message ID is required.' },
    ])

  await discordApi(`/channels/${channelId}/messages/${messageId}`, token, {
    method: 'DELETE',
  })

  return {
    deletedMessageId: messageId,
    deleted: 'true',
  }
}

async function reactToMessage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const channelId = input.reactChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'reactChannel', message: 'Select a channel.' }])

  const messageId = input.reactMessageId?.trim()
  if (!messageId)
    throw new BlockValidationError([
      { field: 'reactMessageId', message: 'Message ID is required.' },
    ])

  const emoji = input.reactEmoji?.trim()
  if (!emoji)
    throw new BlockValidationError([{ field: 'reactEmoji', message: 'Emoji is required.' }])

  // URL-encode the emoji for the path
  const encodedEmoji = encodeURIComponent(emoji)

  await discordApi(
    `/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`,
    token,
    { method: 'PUT' }
  )

  return { success: 'true' }
}
