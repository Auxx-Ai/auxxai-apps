// src/tools/add-discord-member-role.tool.server.ts

import { discordApi } from '../blocks/discord/shared/discord-api'
import { getDiscordToken } from './shared/connection'

interface AddDiscordMemberRoleInput {
  guildId: string
  userId: string
  roleIds: string[]
}

interface AddDiscordMemberRoleOutput {
  success: boolean
  userId: string
  rolesAdded: string[]
}

export default async function addDiscordMemberRole(
  input: AddDiscordMemberRoleInput
): Promise<AddDiscordMemberRoleOutput> {
  const token = getDiscordToken()

  for (const roleId of input.roleIds) {
    try {
      await discordApi(
        `/guilds/${input.guildId}/members/${input.userId}/roles/${roleId}`,
        token,
        { method: 'PUT' }
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    success: true,
    userId: input.userId,
    rolesAdded: input.roleIds,
  }
}
