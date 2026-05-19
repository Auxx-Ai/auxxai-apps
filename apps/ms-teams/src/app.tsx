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
import { channelCreateTool } from './tools/internal/channel-create.tool'
import { channelDeleteTool } from './tools/internal/channel-delete.tool'
import { channelGetTool } from './tools/internal/channel-get.tool'
import { channelGetManyTool } from './tools/internal/channel-get-many.tool'
import { channelMessageCreateTool } from './tools/internal/channel-message-create.tool'
import { channelMessageGetManyTool } from './tools/internal/channel-message-get-many.tool'
import { channelUpdateTool } from './tools/internal/channel-update.tool'
import { chatMessageCreateTool } from './tools/internal/chat-message-create.tool'
import { chatMessageGetTool } from './tools/internal/chat-message-get.tool'
import { chatMessageGetManyTool } from './tools/internal/chat-message-get-many.tool'
import { taskCreateTool } from './tools/internal/task-create.tool'
import { taskDeleteTool } from './tools/internal/task-delete.tool'
import { taskGetTool } from './tools/internal/task-get.tool'
import { taskGetManyTool } from './tools/internal/task-get-many.tool'
import { taskUpdateTool } from './tools/internal/task-update.tool'
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
    // Agent-facing tools.
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
    // Block-internal tools — back the Microsoft Teams workflow block dispatcher.
    // Not exposed to agents (no `agent` key).
    channelCreateTool,
    channelDeleteTool,
    channelGetTool,
    channelGetManyTool,
    channelUpdateTool,
    channelMessageCreateTool,
    channelMessageGetManyTool,
    chatMessageCreateTool,
    chatMessageGetTool,
    chatMessageGetManyTool,
    taskCreateTool,
    taskDeleteTool,
    taskGetTool,
    taskGetManyTool,
    taskUpdateTool,
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
