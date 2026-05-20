// src/blocks/ms-teams/resources/chat-message/chat-message-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { graphApi, graphPaginatedGet, throwConnectionNotFound } from '../../shared/ms-teams-api'

function getToken(): string {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  return connection.value
}

export async function chatMessageCreate(input: Record<string, any>): Promise<Record<string, any>> {
  return createChatMessage(getToken(), input)
}

export async function chatMessageGet(input: Record<string, any>): Promise<Record<string, any>> {
  return getChatMessage(getToken(), input)
}

export async function chatMessageGetMany(input: Record<string, any>): Promise<Record<string, any>> {
  return getManyChatMessages(getToken(), input)
}

async function createChatMessage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const chatId = input.chatCreateChat
  if (!chatId)
    throw new BlockValidationError([{ field: 'chatCreateChat', message: 'Select a chat.' }])

  const message = input.chatCreateMessage?.trim()
  if (!message)
    throw new BlockValidationError([
      { field: 'chatCreateMessage', message: 'Message content is required.' },
    ])

  const contentType = input.chatCreateContentType ?? 'text'
  const body: Record<string, unknown> = {
    body: { contentType, content: message },
  }

  const result = await graphApi<any>('POST', `/chats/${chatId}/messages`, token, { body })

  return {
    messageId: result.id ?? '',
    createdDateTime: result.createdDateTime ?? '',
  }
}

async function getChatMessage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const chatId = input.chatGetChat
  if (!chatId) throw new BlockValidationError([{ field: 'chatGetChat', message: 'Select a chat.' }])

  const messageId = input.chatGetMessageId?.trim()
  if (!messageId)
    throw new BlockValidationError([
      { field: 'chatGetMessageId', message: 'Message ID is required.' },
    ])

  const result = await graphApi<any>('GET', `/chats/${chatId}/messages/${messageId}`, token)

  return {
    messageId: result.id ?? '',
    createdDateTime: result.createdDateTime ?? '',
    content: result.body?.content ?? '',
    contentType: result.body?.contentType ?? '',
    from: result.from ?? {},
  }
}

async function getManyChatMessages(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const chatId = input.chatGetManyChat
  if (!chatId)
    throw new BlockValidationError([{ field: 'chatGetManyChat', message: 'Select a chat.' }])

  const returnAll = input.chatGetManyReturnAll ?? false
  const limit = input.chatGetManyLimit ?? 50

  const { items, totalCount } = await graphPaginatedGet<any>(`/chats/${chatId}/messages`, token, {
    returnAll,
    limit,
  })

  return {
    messages: items,
    totalCount: String(totalCount),
  }
}
