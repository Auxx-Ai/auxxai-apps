// src/tools/get-discord-channel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import getDiscordChannelExecute from './get-discord-channel.tool.server'

export const getDiscordChannelTool = defineTool({
  id: 'get_discord_channel',
  name: 'Get Discord channel',
  description:
    'Fetch a single Discord channel with its topic and parent category. Use when the LLM already has a channelId (from list_discord_channels or search_discord_messages) and needs context like the topic.',
  icon: discordIcon,
  inputs: z.object({
    channelId: z
      .string()
      .describe('Channel id (from list_discord_channels or search_discord_messages).'),
  }),
  outputs: z.object({
    channelId: z.string(),
    guildId: z.string().nullable(),
    name: z.string(),
    type: z.enum(['text', 'voice', 'category', 'other']),
    topic: z.string().nullable(),
    parentId: z.string().nullable(),
    nsfw: z.boolean(),
  }),
  exampleOutput: {
    channelId: '1086542100000000002',
    guildId: '1086542001234567890',
    name: 'support',
    type: 'text',
    topic: 'Ask questions and get help from the community',
    parentId: '1086542100000000000',
    nsfw: false,
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getDiscordChannelExecute,
  agent: { toolsetSlug: 'discord.channels.read' },
})
