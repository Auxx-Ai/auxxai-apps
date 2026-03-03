// src/blocks/discord/resources/channel/channel-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { discordApi, throwConnectionNotFound } from '../../shared/discord-api'

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
  const guildId = input.createGuild
  if (!guildId)
    throw new BlockValidationError([{ field: 'createGuild', message: 'Select a server.' }])

  const name = input.createName?.trim()
  if (!name)
    throw new BlockValidationError([{ field: 'createName', message: 'Channel name is required.' }])

  const type = CHANNEL_TYPE_MAP[input.createType ?? 'text'] ?? 0

  const body: Record<string, unknown> = { name, type }
  if (input.createTopic?.trim()) body.topic = input.createTopic.trim()
  if (input.createCategory) body.parent_id = input.createCategory
  if (input.createNsfw) body.nsfw = true

  const result = await discordApi<any>(`/guilds/${guildId}/channels`, token, {
    method: 'POST',
    body,
  })

  return {
    channelId: result.id ?? '',
    channelName: result.name ?? name,
    channelType: CHANNEL_TYPE_LABELS[result.type] ?? String(result.type),
  }
}

async function getChannel(token: string, input: Record<string, any>): Promise<Record<string, any>> {
  const channelId = input.getChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'getChannel', message: 'Select a channel.' }])

  const result = await discordApi<any>(`/channels/${channelId}`, token)

  return {
    channelId: result.id ?? '',
    channelName: result.name ?? '',
    channelType: CHANNEL_TYPE_LABELS[result.type] ?? String(result.type),
    channelTopic: result.topic ?? '',
    channelData: result,
  }
}

async function getManyChannels(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const guildId = input.getManyGuild
  if (!guildId)
    throw new BlockValidationError([{ field: 'getManyGuild', message: 'Select a server.' }])

  const channels = await discordApi<any[]>(`/guilds/${guildId}/channels`, token)

  const filterType = input.getManyFilterType ?? 'all'
  const typeFilter =
    filterType === 'text'
      ? 0
      : filterType === 'voice'
        ? 2
        : filterType === 'category'
          ? 4
          : undefined

  const filtered =
    typeFilter !== undefined ? channels.filter((ch) => ch.type === typeFilter) : channels

  return {
    channels: filtered,
    totalCount: String(filtered.length),
  }
}

async function updateChannel(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const channelId = input.updateChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'updateChannel', message: 'Select a channel.' }])

  const body: Record<string, unknown> = {}
  if (input.updateName?.trim()) body.name = input.updateName.trim()
  if (input.updateTopic !== undefined && input.updateTopic !== '') {
    body.topic = input.updateTopic.trim()
  }
  if (input.updateCategory) body.parent_id = input.updateCategory
  if (input.updateNsfw !== undefined) body.nsfw = input.updateNsfw

  const result = await discordApi<any>(`/channels/${channelId}`, token, {
    method: 'PATCH',
    body,
  })

  return {
    channelId: result.id ?? '',
    channelName: result.name ?? '',
    channelData: result,
  }
}

async function deleteChannel(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const channelId = input.deleteChannel
  if (!channelId)
    throw new BlockValidationError([{ field: 'deleteChannel', message: 'Select a channel.' }])

  const result = await discordApi<any>(`/channels/${channelId}`, token, {
    method: 'DELETE',
  })

  return {
    deletedChannelId: result.id ?? channelId,
    deletedChannelName: result.name ?? '',
  }
}
