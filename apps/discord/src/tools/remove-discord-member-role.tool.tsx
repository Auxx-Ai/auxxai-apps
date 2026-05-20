// src/tools/remove-discord-member-role.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import removeDiscordMemberRoleExecute from './remove-discord-member-role.tool.server'

/**
 * Internal tool — backs `discord` block's `member.roleRemove` op. Not
 * exposed to agents.
 */
export const removeDiscordMemberRoleTool = defineTool({
  id: 'remove_discord_member_role',
  name: 'Remove Discord member role',
  description: 'Remove one or more roles from a Discord server member.',
  icon: discordIcon,
  inputs: z.object({
    guildId: z.string(),
    userId: z.string(),
    roleIds: z.array(z.string()).min(1),
  }),
  outputs: z.object({
    success: z.boolean(),
    userId: z.string(),
    rolesRemoved: z.array(z.string()),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: removeDiscordMemberRoleExecute,
})
