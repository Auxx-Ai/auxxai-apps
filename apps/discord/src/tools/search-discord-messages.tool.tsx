// src/tools/search-discord-messages.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import searchDiscordMessagesExecute from './search-discord-messages.tool.server'

export const searchDiscordMessagesTool = defineTool({
  id: 'search_discord_messages',
  name: 'Search Discord messages',
  description:
    'Search recent messages in one or more Discord channels. Bots cannot use the Discord user-facing search index; this tool walks recent messages per channel and filters client-side, so matches older than perChannelLimit*channelIds may be missed.',
  icon: discordIcon,
  inputs: z.object({
    channelIds: z
      .array(z.string())
      .min(1)
      .max(5)
      .describe(
        'Channels to search. Cap at 5 to keep within token budget. Use list_discord_channels to discover ids.'
      ),
    q: z
      .string()
      .optional()
      .describe(
        'Substring to match in message content (case-insensitive). Omit to return recent messages unfiltered.'
      ),
    authorId: z.string().optional().describe('Restrict to messages by this user id.'),
    since: z.string().optional().describe('ISO 8601 lower bound. Default: 7 days ago.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Max matches to return across all channels. Default 25. Hard cap 100.'),
  }),
  outputs: z.object({
    matches: z.array(
      z.object({
        messageId: z.string(),
        channelId: z.string(),
        channelName: z.string().describe('Resolved from the input channelIds for LLM readability.'),
        content: z.string(),
        authorId: z.string(),
        authorUsername: z.string(),
        timestamp: z.string(),
      })
    ),
    truncated: z.boolean().describe('True if the walk hit the hard cap before finishing.'),
  }),
  exampleOutput: {
    matches: [
      {
        messageId: '1086545000000000031',
        channelId: '1086542100000000002',
        channelName: 'support',
        content: 'Has anyone run into the v2 migration issue? Getting a timeout on import.',
        authorId: '1086543000000000011',
        authorUsername: 'jane_cooper',
        timestamp: '2026-06-07T14:31:00Z',
      },
      {
        messageId: '1086545000000000045',
        channelId: '1086542100000000002',
        channelName: 'support',
        content: 'The migration timeout is fixed in 2.1.3 — try bumping the package.',
        authorId: '1086543000000000012',
        authorUsername: 'dev_marcus',
        timestamp: '2026-06-07T15:02:00Z',
      },
    ],
    truncated: false,
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: searchDiscordMessagesExecute,
  agent: { toolsetSlug: 'discord.messages.read' },
})
