// src/tools/create-discord-channel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import createDiscordChannelExecute from './create-discord-channel.tool.server'

/**
 * Internal tool — backs `discord` block's `channel.create` op. Not exposed
 * to agents (no `agent` key). Channel admin stays in the workflow block per
 * the toolsets read/write split.
 */
export const createDiscordChannelTool = defineTool({
  id: 'create_discord_channel',
  name: 'Create Discord channel',
  description: 'Create a new channel in a Discord server.',
  icon: discordIcon,
  inputs: z.object({
    guildId: z.string(),
    name: z.string(),
    type: z.enum(['text', 'voice', 'category']).optional(),
    topic: z.string().optional(),
    parentId: z.string().optional(),
    nsfw: z.boolean().optional(),
  }),
  outputs: z.object({
    channelId: z.string(),
    channelName: z.string(),
    channelType: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createDiscordChannelExecute,
})
