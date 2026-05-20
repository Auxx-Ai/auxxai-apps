// src/tools/delete-discord-channel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import deleteDiscordChannelExecute from './delete-discord-channel.tool.server'

/**
 * Internal tool — backs `discord` block's `channel.delete` op. Not exposed
 * to agents.
 */
export const deleteDiscordChannelTool = defineTool({
  id: 'delete_discord_channel',
  name: 'Delete Discord channel',
  description: 'Permanently delete a Discord channel.',
  icon: discordIcon,
  inputs: z.object({
    channelId: z.string(),
  }),
  outputs: z.object({
    deletedChannelId: z.string(),
    deletedChannelName: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: deleteDiscordChannelExecute,
})
