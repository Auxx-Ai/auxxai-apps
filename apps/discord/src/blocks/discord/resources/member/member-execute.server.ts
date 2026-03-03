// src/blocks/discord/resources/member/member-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { discordApi, discordPaginatedGet, throwConnectionNotFound } from '../../shared/discord-api'

export async function executeMember(
  operation: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'getMany':
      return getManyMembers(token, input)
    case 'roleAdd':
      return addRoleToMember(token, input)
    case 'roleRemove':
      return removeRoleFromMember(token, input)
    default:
      throw new Error(`Unknown member operation: ${operation}`)
  }
}

async function getManyMembers(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const guildId = input.getManyMemberGuild
  if (!guildId)
    throw new BlockValidationError([{ field: 'getManyMemberGuild', message: 'Select a server.' }])

  const returnAll = input.getManyMemberReturnAll ?? false
  const limit = input.getManyMemberLimit ?? 100

  const { items, truncated } = await discordPaginatedGet<any>(`/guilds/${guildId}/members`, token, {
    returnAll,
    limit,
    cursorParam: 'after',
    pageSize: 1000,
  })

  const members = items.map((m: any) => ({
    userId: m.user?.id ?? '',
    username: m.user?.username ?? '',
    displayName: m.nick || m.user?.global_name || m.user?.username || '',
    roles: m.roles ?? [],
    joinedAt: m.joined_at ?? '',
  }))

  return {
    members: members,
    totalCount: String(members.length),
    truncated: String(truncated),
  }
}

async function addRoleToMember(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const guildId = input.roleAddGuild
  if (!guildId)
    throw new BlockValidationError([{ field: 'roleAddGuild', message: 'Select a server.' }])

  const userId = input.roleAddUserId?.trim()
  if (!userId)
    throw new BlockValidationError([{ field: 'roleAddUserId', message: 'User ID is required.' }])

  const roleValue = input.roleAddRoles
  if (!roleValue)
    throw new BlockValidationError([
      { field: 'roleAddRoles', message: 'Select at least one role.' },
    ])

  // Handle both single value and comma-separated values
  const roleIds =
    typeof roleValue === 'string'
      ? roleValue
          .split(',')
          .map((r: string) => r.trim())
          .filter(Boolean)
      : [roleValue]

  for (const roleId of roleIds) {
    try {
      await discordApi(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, token, {
        method: 'PUT',
      })
    } catch (error: any) {
      if (error.message?.includes('Missing Permissions') || error.message?.includes('permission')) {
        throw new Error(
          `Cannot manage role ${roleId} — it may be higher than the bot's role in the server hierarchy.`
        )
      }
      throw error
    }
  }

  return {
    success: 'true',
    userId,
    rolesAdded: roleIds,
  }
}

async function removeRoleFromMember(
  token: string,
  input: Record<string, any>
): Promise<Record<string, any>> {
  const guildId = input.roleRemoveGuild
  if (!guildId)
    throw new BlockValidationError([{ field: 'roleRemoveGuild', message: 'Select a server.' }])

  const userId = input.roleRemoveUserId?.trim()
  if (!userId)
    throw new BlockValidationError([{ field: 'roleRemoveUserId', message: 'User ID is required.' }])

  const roleValue = input.roleRemoveRoles
  if (!roleValue)
    throw new BlockValidationError([
      { field: 'roleRemoveRoles', message: 'Select at least one role.' },
    ])

  const roleIds =
    typeof roleValue === 'string'
      ? roleValue
          .split(',')
          .map((r: string) => r.trim())
          .filter(Boolean)
      : [roleValue]

  for (const roleId of roleIds) {
    try {
      await discordApi(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, token, {
        method: 'DELETE',
      })
    } catch (error: any) {
      if (error.message?.includes('Missing Permissions') || error.message?.includes('permission')) {
        throw new Error(
          `Cannot manage role ${roleId} — it may be higher than the bot's role in the server hierarchy.`
        )
      }
      throw error
    }
  }

  return {
    success: 'true',
    userId,
    rolesRemoved: roleIds,
  }
}
