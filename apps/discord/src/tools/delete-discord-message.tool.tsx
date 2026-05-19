// src/tools/delete-discord-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import deleteDiscordMessageExecute from './delete-discord-message.tool.server'

/**
 * Internal tool — backs `discord` block's `message.delete` op. Not exposed
 * to agents.
 */
export const deleteDiscordMessageTool = defineTool({
  id: 'delete_discord_message',
  name: 'Delete Discord message',
  description: 'Delete a Discord message.',
  icon: discordIcon,
  inputs: z.object({
    channelId: z.string(),
    messageId: z.string(),
  }),
  outputs: z.object({
    deletedMessageId: z.string(),
    deleted: z.boolean(),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: deleteDiscordMessageExecute,
})
