// src/tools/react-to-discord-message.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import discordIcon from '../assets/icon.png'
import reactToDiscordMessageExecute from './react-to-discord-message.tool.server'

export const reactToDiscordMessageTool = defineTool({
  id: 'react_to_discord_message',
  name: 'React to Discord message',
  description:
    'Add a reaction to an existing Discord message. Emoji may be unicode (e.g. 👍) or a custom emoji in the form `name:id`.',
  icon: discordIcon,
  inputs: z.object({
    channelId: z.string(),
    messageId: z.string(),
    emoji: z
      .string()
      .describe(
        'Emoji to react with. Unicode (e.g. "👍", "🎉") or custom emoji in `name:id` format.'
      ),
  }),
  outputs: z.object({
    success: z.literal(true),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: reactToDiscordMessageExecute,
  agent: { toolsetSlug: 'discord.messages.write' },
})
