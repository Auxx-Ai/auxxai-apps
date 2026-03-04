// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { discordBlock } from './blocks/discord/discord.workflow'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [discordBlock],
    triggers: [],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">Discord</TextBlock>
      <TextBlock align="left">
        Send messages, manage channels, and manage member roles in your Discord servers. Connect
        your Discord Bot Token in Settings to get started.
      </TextBlock>
      <TextBlock align="left">
        Setup: Create a Discord Application at discord.com/developers, create a bot, copy the Bot
        Token, and add the bot to your server with the required permissions (Send Messages, Manage
        Messages, Manage Channels, Manage Roles, Read Message History, Add Reactions).
      </TextBlock>
    </>
  )
}
