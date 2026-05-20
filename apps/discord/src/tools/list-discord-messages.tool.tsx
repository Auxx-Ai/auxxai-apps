// src/tools/list-discord-messages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import listDiscordMessagesExecute from './list-discord-messages.tool.server'

/**
 * Internal tool — backs `discord` block's `message.getMany` op. Paginated
 * channel message listing for workflows; agent message reads go through
 * `search_discord_messages` instead.
 */
export const listDiscordMessagesTool = defineTool({
  id: 'list_discord_messages',
  name: 'List Discord messages',
  description: 'List recent messages in a Discord channel with pagination support.',
  icon: discordIcon,
  inputs: z.object({
    channelId: z.string(),
    returnAll: z.boolean().optional(),
    limit: z.number().int().min(1).optional(),
  }),
  outputs: z.object({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: z.array(z.any()),
    totalCount: z.string(),
    truncated: z.string(),
  }),
  config: {
    requiresConnection: true,
    timeout: 30000,
  },
  execute: listDiscordMessagesExecute,
})
