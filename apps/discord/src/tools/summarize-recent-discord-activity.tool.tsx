// src/tools/summarize-recent-discord-activity.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import summarizeRecentDiscordActivityExecute from './summarize-recent-discord-activity.tool.server'

export const summarizeRecentDiscordActivityTool = defineTool({
  id: 'summarize_recent_discord_activity',
  name: 'Summarize recent Discord activity',
  description:
    'Fan out across recent messages in N channels of a Discord server, emit per-channel progress as the walk proceeds, and return an aggregated summary (volume per channel, top authors, sample messages).',
  icon: discordIcon,
  inputs: z.object({
    guildId: z.string().describe('Server to summarize.'),
    channelIds: z
      .array(z.string())
      .max(10)
      .optional()
      .describe(
        'Restrict to these channels. Omit to summarize the top 10 most-recently-active text channels in the guild.'
      ),
    since: z.string().optional().describe('ISO 8601 lower bound. Default: 24 hours ago.'),
    perChannelLimit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Messages to scan per channel. Default 50.'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe(
        'LLM-readable rollup: total messages, top channels by volume, top authors, notable topics.'
      ),
    channels: z.array(
      z.object({
        channelId: z.string(),
        channelName: z.string(),
        messageCount: z.number(),
        uniqueAuthors: z.number(),
        sampleMessages: z
          .array(
            z.object({
              authorUsername: z.string(),
              content: z.string(),
              timestamp: z.string(),
            })
          )
          .describe('Up to 3 representative messages per channel.'),
      })
    ),
  }),
  config: {
    requiresConnection: true,
    timeout: 60000,
    streaming: true,
  },
  execute: summarizeRecentDiscordActivityExecute,
})
