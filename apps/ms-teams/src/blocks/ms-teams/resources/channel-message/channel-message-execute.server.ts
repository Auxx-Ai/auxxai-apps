// src/blocks/ms-teams/resources/channel-message/channel-message-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { graphApi, graphPaginatedGet, throwConnectionNotFound } from '../../shared/ms-teams-api'

export async function executeChannelMessage(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'create':
      return createChannelMessage(token, input)
    case 'getMany':
      return getManyChannelMessages(token, input)
    default:
      throw new Error(`Unknown channel message operation: ${operation}`)
  }
}

async function createChannelMessage(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const teamId = input.msgCreateTeam
  if (!teamId)
    throw new BlockValidationError([{ field: 'msgCreateTeam', message: 'Select a team.' }])

  const channelId = input.msgCreateChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'msgCreateChannel', message: 'Select a channel.' }])

  const message = input.msgCreateMessage?.trim()
  if (!message)
    throw new BlockValidationError([
      { field: 'msgCreateMessage', message: 'Message content is required.' },
    ])

  const contentType = input.msgCreateContentType ?? 'text'
  const body: Record<string, unknown> = {
    body: { contentType, content: message },
  }

  const replyToId = input.msgCreateReplyToId?.trim()
  let endpoint: string

  if (replyToId) {
    endpoint = `/teams/${teamId}/channels/${channelId}/messages/${replyToId}/replies`
  } else {
    endpoint = `/teams/${teamId}/channels/${channelId}/messages`
  }

  const result = await graphApi<any>('POST', endpoint, token, {
    body,
    version: 'beta',
  })

  return {
    messageId: result.id ?? '',
    createdDateTime: result.createdDateTime ?? '',
    webUrl: result.webUrl ?? '',
  }
}

async function getManyChannelMessages(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const teamId = input.msgGetManyTeam
  if (!teamId)
    throw new BlockValidationError([{ field: 'msgGetManyTeam', message: 'Select a team.' }])

  const channelId = input.msgGetManyChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'msgGetManyChannel', message: 'Select a channel.' }])

  const returnAll = input.msgGetManyReturnAll ?? false
  const limit = input.msgGetManyLimit ?? 50

  const { items, totalCount } = await graphPaginatedGet<any>(
    `/teams/${teamId}/channels/${channelId}/messages`,
    token,
    { returnAll, limit, version: 'beta' }
  )

  return {
    messages: items,
    totalCount: String(totalCount),
  }
}
