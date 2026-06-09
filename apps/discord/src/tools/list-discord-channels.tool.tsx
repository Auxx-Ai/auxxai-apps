// src/tools/list-discord-channels.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import listDiscordChannelsExecute from './list-discord-channels.tool.server'

export const listDiscordChannelsTool = defineTool({
  id: 'list_discord_channels',
  name: 'List Discord channels',
  description:
    'List channels in a Discord server. Use list_discord_guilds first if the user has not named a server. Filter by `text`, `voice`, or `category` when only one kind is relevant.',
  icon: discordIcon,
  inputs: z.object({
    guildId: z.string().describe('Server id. Use list_discord_guilds if unknown.'),
    filterType: z
      .enum(['all', 'text', 'voice', 'category'])
      .optional()
      .describe('Filter channels by type. Default: all.'),
  }),
  outputs: z.object({
    channels: z.array(
      z.object({
        channelId: z.string(),
        name: z.string(),
        type: z.enum(['text', 'voice', 'category', 'other']),
        topic: z.string().nullable(),
        parentId: z.string().nullable().describe('Parent category id if nested.'),
        position: z.number(),
      })
    ),
  }),
  exampleOutput: {
    channels: [
      {
        channelId: '1086542100000000001',
        name: 'general',
        type: 'text',
        topic: 'Community-wide chit-chat',
        parentId: '1086542100000000000',
        position: 0,
      },
      {
        channelId: '1086542100000000002',
        name: 'support',
        type: 'text',
        topic: null,
        parentId: '1086542100000000000',
        position: 1,
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listDiscordChannelsExecute,
  agent: { toolsetSlug: 'discord.channels.read' },
})
