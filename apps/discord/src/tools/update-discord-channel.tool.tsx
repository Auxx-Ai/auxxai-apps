// src/tools/update-discord-channel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import updateDiscordChannelExecute from './update-discord-channel.tool.server'

/**
 * Internal tool — backs `discord` block's `channel.update` op. Not exposed
 * to agents.
 */
export const updateDiscordChannelTool = defineTool({
  id: 'update_discord_channel',
  name: 'Update Discord channel',
  description: 'Update properties of a Discord channel.',
  icon: discordIcon,
  inputs: z.object({
    channelId: z.string(),
    name: z.string().optional(),
    topic: z.string().optional(),
    parentId: z.string().optional(),
    nsfw: z.boolean().optional(),
  }),
  outputs: z.object({
    channelId: z.string(),
    channelName: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: updateDiscordChannelExecute,
})
