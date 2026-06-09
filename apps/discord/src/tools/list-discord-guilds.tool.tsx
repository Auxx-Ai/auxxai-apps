// src/tools/list-discord-guilds.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import listDiscordGuildsExecute from './list-discord-guilds.tool.server'

export const listDiscordGuildsTool = defineTool({
  id: 'list_discord_guilds',
  name: 'List Discord servers',
  description:
    'List the Discord servers (guilds) the connected bot is a member of. Use this once before any other Discord tool when the user has not named a server explicitly.',
  icon: discordIcon,
  inputs: z.object({}),
  outputs: z.object({
    guilds: z
      .array(
        z.object({
          guildId: z.string().describe('Guild id to use in subsequent tool calls.'),
          name: z.string().describe('Server name shown in Discord.'),
          iconUrl: z.string().nullable(),
          owner: z.boolean().describe('True if the bot owns the guild (rare).'),
        })
      )
      .describe('All servers the bot is currently joined to.'),
  }),
  exampleOutput: {
    guilds: [
      {
        guildId: '1086542001234567890',
        name: 'Acme Community',
        iconUrl: 'https://cdn.discordapp.com/icons/1086542001234567890/a1b2c3d4e5f6.png',
        owner: false,
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listDiscordGuildsExecute,
  agent: {},
})
