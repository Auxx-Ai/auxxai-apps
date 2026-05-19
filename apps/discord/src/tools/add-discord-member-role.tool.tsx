// src/tools/add-discord-member-role.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import addDiscordMemberRoleExecute from './add-discord-member-role.tool.server'

/**
 * Internal tool — backs `discord` block's `member.roleAdd` op. Not exposed
 * to agents; role management stays in the workflow block per toolsets.
 */
export const addDiscordMemberRoleTool = defineTool({
  id: 'add_discord_member_role',
  name: 'Add Discord member role',
  description: 'Add one or more roles to a Discord server member.',
  icon: discordIcon,
  inputs: z.object({
    guildId: z.string(),
    userId: z.string(),
    roleIds: z.array(z.string()).min(1),
  }),
  outputs: z.object({
    success: z.boolean(),
    userId: z.string(),
    rolesAdded: z.array(z.string()),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: addDiscordMemberRoleExecute,
})
