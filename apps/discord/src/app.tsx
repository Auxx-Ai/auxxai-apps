// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { discordBlock } from './blocks/discord/discord.workflow'
import { addDiscordMemberRoleTool } from './tools/add-discord-member-role.tool'
import { createDiscordChannelTool } from './tools/create-discord-channel.tool'
import { deleteDiscordChannelTool } from './tools/delete-discord-channel.tool'
import { deleteDiscordMessageTool } from './tools/delete-discord-message.tool'
import { getDiscordChannelTool } from './tools/get-discord-channel.tool'
import { getDiscordMessageTool } from './tools/get-discord-message.tool'
import { listDiscordChannelsTool } from './tools/list-discord-channels.tool'
import { listDiscordGuildsTool } from './tools/list-discord-guilds.tool'
import { listDiscordMembersTool } from './tools/list-discord-members.tool'
import { listDiscordMessagesTool } from './tools/list-discord-messages.tool'
import { reactToDiscordMessageTool } from './tools/react-to-discord-message.tool'
import { removeDiscordMemberRoleTool } from './tools/remove-discord-member-role.tool'
import { searchDiscordMessagesTool } from './tools/search-discord-messages.tool'
import { sendDiscordMessageTool } from './tools/send-discord-message.tool'
import { summarizeRecentDiscordActivityTool } from './tools/summarize-recent-discord-activity.tool'
import { updateDiscordChannelTool } from './tools/update-discord-channel.tool'
import { discordToolsets } from './tools/toolsets'

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
  tools: [
    // Agent-facing tools (surfaced via `agent` keys + discordToolsets).
    listDiscordGuildsTool,
    listDiscordChannelsTool,
    getDiscordChannelTool,
    searchDiscordMessagesTool,
    getDiscordMessageTool,
    summarizeRecentDiscordActivityTool,
    listDiscordMembersTool,
    sendDiscordMessageTool,
    reactToDiscordMessageTool,
    // Internal tools — backing the `discord` block dispatcher only.
    createDiscordChannelTool,
    updateDiscordChannelTool,
    deleteDiscordChannelTool,
    deleteDiscordMessageTool,
    listDiscordMessagesTool,
    addDiscordMemberRoleTool,
    removeDiscordMemberRoleTool,
  ],
  toolsets: discordToolsets,
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
