// src/tools/get-discord-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import getDiscordMessageExecute from './get-discord-message.tool.server'

export const getDiscordMessageTool = defineTool({
  id: 'get_discord_message',
  name: 'Get Discord message',
  description:
    'Fetch a single Discord message by id. Returns content, author, timestamp, attachments, and reactions.',
  icon: discordIcon,
  inputs: z.object({
    channelId: z.string(),
    messageId: z.string().describe('Message id (from search_discord_messages).'),
  }),
  outputs: z.object({
    messageId: z.string(),
    channelId: z.string(),
    content: z.string(),
    authorId: z.string(),
    authorUsername: z.string(),
    authorBot: z.boolean(),
    timestamp: z.string(),
    editedAt: z.string().nullable(),
    attachments: z.array(
      z.object({
        url: z.string(),
        filename: z.string(),
        contentType: z.string().nullable(),
      })
    ),
    reactions: z.array(
      z.object({
        emoji: z.string().describe('Unicode emoji or `name:id` for custom.'),
        count: z.number(),
      })
    ),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getDiscordMessageExecute,
  agent: { toolsetSlug: 'discord.messages.read' },
})
