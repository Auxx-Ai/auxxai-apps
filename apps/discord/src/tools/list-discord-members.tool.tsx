// src/tools/list-discord-members.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import listDiscordMembersExecute from './list-discord-members.tool.server'

export const listDiscordMembersTool = defineTool({
  id: 'list_discord_members',
  name: 'List Discord members',
  description:
    'List members of a Discord server. Requires the bot to have the Server Members Intent enabled in the Discord Developer Portal. Capped at one Discord page (1000) — use the workflow block for larger fan-out.',
  icon: discordIcon,
  inputs: z.object({
    guildId: z.string(),
    q: z
      .string()
      .optional()
      .describe('Substring to match against username or display name. Client-side filter.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .describe('Max members to return. Default 100. Hard cap 1000 (one Discord page).'),
  }),
  outputs: z.object({
    members: z.array(
      z.object({
        userId: z.string(),
        username: z.string(),
        displayName: z.string().describe('Guild nickname if set, else username.'),
        bot: z.boolean(),
        roles: z.array(z.string()).describe('Role ids assigned to the member.'),
        joinedAt: z.string().nullable(),
      })
    ),
    truncated: z.boolean(),
  }),
  exampleOutput: {
    members: [
      {
        userId: '1086543000000000011',
        username: 'jane_cooper',
        displayName: 'Jane',
        bot: false,
        roles: ['1086544000000000021', '1086544000000000022'],
        joinedAt: '2026-01-14T08:22:00Z',
      },
      {
        userId: '1086543000000000099',
        username: 'acme_bot',
        displayName: 'Acme Bot',
        bot: true,
        roles: ['1086544000000000020'],
        joinedAt: '2025-11-02T12:00:00Z',
      },
    ],
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: listDiscordMembersExecute,
  agent: { toolsetSlug: 'discord.members.read' },
})
