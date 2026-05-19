// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { msTeamsBlock } from './blocks/ms-teams/ms-teams.workflow'
import { findMsTeamsChannelTool } from './tools/find-ms-teams-channel.tool'
import { findMsTeamsChatTool } from './tools/find-ms-teams-chat.tool'
import { findMsTeamsUserTool } from './tools/find-ms-teams-user.tool'
import { getMsTeamsChannelTool } from './tools/get-ms-teams-channel.tool'
import { getMsTeamsChatTool } from './tools/get-ms-teams-chat.tool'
import { getMsTeamsMessageRepliesTool } from './tools/get-ms-teams-message-replies.tool'
import { getMsTeamsUserTool } from './tools/get-ms-teams-user.tool'
import { getRecentMsTeamsChannelMessagesTool } from './tools/get-recent-ms-teams-channel-messages.tool'
import { getRecentMsTeamsChatMessagesTool } from './tools/get-recent-ms-teams-chat-messages.tool'
import { listMsTeamsChannelsTool } from './tools/list-ms-teams-channels.tool'
import { listMsTeamsChatsTool } from './tools/list-ms-teams-chats.tool'
import { listMsTeamsTeamsTool } from './tools/list-ms-teams-teams.tool'
import { replyToMsTeamsChannelMessageTool } from './tools/reply-to-ms-teams-channel-message.tool'
import { sendMsTeamsChannelMessageTool } from './tools/send-ms-teams-channel-message.tool'
import { sendMsTeamsChatMessageTool } from './tools/send-ms-teams-chat-message.tool'
import { msTeamsToolsets } from './tools/toolsets'

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
    blocks: [msTeamsBlock],
    triggers: [],
  },
  tools: [
    listMsTeamsTeamsTool,
    listMsTeamsChatsTool,
    findMsTeamsChannelTool,
    listMsTeamsChannelsTool,
    getMsTeamsChannelTool,
    findMsTeamsChatTool,
    getMsTeamsChatTool,
    findMsTeamsUserTool,
    getMsTeamsUserTool,
    getRecentMsTeamsChannelMessagesTool,
    getRecentMsTeamsChatMessagesTool,
    getMsTeamsMessageRepliesTool,
    sendMsTeamsChannelMessageTool,
    replyToMsTeamsChannelMessageTool,
    sendMsTeamsChatMessageTool,
  ],
  toolsets: msTeamsToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Microsoft Teams</TextBlock>
      <TextBlock align="left">
        Automate Microsoft Teams — manage channels, send messages to channels and chats, and create
        Planner tasks directly from your workflows.
      </TextBlock>
      <TextBlock align="left">
        Connect your Microsoft account in Settings → Connections, then use the Microsoft Teams
        workflow blocks and AI tools to automate your support workflows.
      </TextBlock>
    </>
  )
}
