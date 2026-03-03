// src/blocks/ms-teams/resources/channel/channel-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { graphApi, graphPaginatedGet, throwConnectionNotFound } from '../../shared/ms-teams-api'

export async function executeChannel(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'create':
      return createChannel(token, input)
    case 'delete':
      return deleteChannel(token, input)
    case 'get':
      return getChannel(token, input)
    case 'getMany':
      return getManyChannels(token, input)
    case 'update':
      return updateChannel(token, input)
    default:
      throw new Error(`Unknown channel operation: ${operation}`)
  }
}

async function createChannel(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const teamId = input.channelCreateTeam
  if (!teamId)
    throw new BlockValidationError([{ field: 'channelCreateTeam', message: 'Select a team.' }])

  const displayName = input.channelCreateName?.trim()
  if (!displayName)
    throw new BlockValidationError([
      { field: 'channelCreateName', message: 'Channel name is required.' },
    ])

  const body: Record<string, unknown> = {
    displayName,
    membershipType: input.channelCreateType ?? 'standard',
  }
  if (input.channelCreateDescription?.trim()) {
    body.description = input.channelCreateDescription.trim()
  }

  const result = await graphApi<any>('POST', `/teams/${teamId}/channels`, token, { body })

  return {
    channelId: result.id ?? '',
    displayName: result.displayName ?? displayName,
    description: result.description ?? '',
  }
}

async function getChannel(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const teamId = input.channelGetTeam
  if (!teamId)
    throw new BlockValidationError([{ field: 'channelGetTeam', message: 'Select a team.' }])

  const channelId = input.channelGetChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'channelGetChannel', message: 'Select a channel.' }])

  const result = await graphApi<any>('GET', `/teams/${teamId}/channels/${channelId}`, token)

  return {
    channelId: result.id ?? '',
    displayName: result.displayName ?? '',
    description: result.description ?? '',
    membershipType: result.membershipType ?? '',
    webUrl: result.webUrl ?? '',
  }
}

async function getManyChannels(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const teamId = input.channelGetManyTeam
  if (!teamId)
    throw new BlockValidationError([{ field: 'channelGetManyTeam', message: 'Select a team.' }])

  const returnAll = input.channelGetManyReturnAll ?? false
  const limit = input.channelGetManyLimit ?? 50

  const { items, totalCount } = await graphPaginatedGet<any>(`/teams/${teamId}/channels`, token, {
    returnAll,
    limit,
  })

  return {
    channels: items,
    totalCount: String(totalCount),
  }
}

async function updateChannel(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const teamId = input.channelUpdateTeam
  if (!teamId)
    throw new BlockValidationError([{ field: 'channelUpdateTeam', message: 'Select a team.' }])

  const channelId = input.channelUpdateChannel
  if (!channelId)
    throw new BlockValidationError([
      { field: 'channelUpdateChannel', message: 'Select a channel.' },
    ])

  const body: Record<string, unknown> = {}
  if (input.channelUpdateName?.trim()) body.displayName = input.channelUpdateName.trim()
  if (input.channelUpdateDescription !== undefined && input.channelUpdateDescription !== '') {
    body.description = input.channelUpdateDescription.trim()
  }

  await graphApi('PATCH', `/teams/${teamId}/channels/${channelId}`, token, { body })

  return {
    channelId,
    displayName: (input.channelUpdateName?.trim() as string) ?? '',
  }
}

async function deleteChannel(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const teamId = input.channelDeleteTeam
  if (!teamId)
    throw new BlockValidationError([{ field: 'channelDeleteTeam', message: 'Select a team.' }])

  const channelId = input.channelDeleteChannel
  if (!channelId)
    throw new BlockValidationError([
      { field: 'channelDeleteChannel', message: 'Select a channel.' },
    ])

  await graphApi('DELETE', `/teams/${teamId}/channels/${channelId}`, token)

  return {
    success: 'true',
  }
}
