// src/tools/send-discord-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import sendDiscordMessageExecute from './send-discord-message.tool.server'

export const sendDiscordMessageTool = defineTool({
  id: 'send_discord_message',
  name: 'Send Discord message',
  description:
    'Post a message in a Discord text channel. Use replyToMessageId to thread under an existing message. Enabling this toolset on an agent is the authorization to post.',
  icon: discordIcon,
  inputs: z.object({
    channelId: z.string().describe('Target text channel id.'),
    content: z.string().min(1).max(2000).describe('Message body. 1-2000 chars (Discord limit).'),
    replyToMessageId: z
      .string()
      .optional()
      .describe('Message id to reply to. The reply will thread under the original in Discord UI.'),
    suppressEmbeds: z.boolean().optional().describe('Suppress link unfurls. Default false.'),
    suppressNotifications: z
      .boolean()
      .optional()
      .describe('Suppress push/desktop notifications (silent send). Default false.'),
  }),
  outputs: z.object({
    messageId: z.string(),
    channelId: z.string(),
    content: z.string(),
    timestamp: z.string(),
    url: z.string().describe('https deep link to the posted message.'),
  }),
  exampleOutput: {
    messageId: '1086545000000000060',
    channelId: '1086542100000000002',
    content: 'Thanks for reporting — this is fixed in 2.1.3. Let us know if it persists!',
    timestamp: '2026-06-08T09:15:00Z',
    url: 'https://discord.com/channels/1086542001234567890/1086542100000000002/1086545000000000060',
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: sendDiscordMessageExecute,
  agent: { toolsetSlug: 'discord.messages.write' },
})
