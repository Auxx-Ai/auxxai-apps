// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { slackBlock } from './blocks/slack/slack.workflow'
import { addSlackReactionTool } from './tools/add-slack-reaction.tool'
import { findSlackChannelTool } from './tools/find-slack-channel.tool'
import { findSlackUserTool } from './tools/find-slack-user.tool'
import { getRecentSlackMessagesTool } from './tools/get-recent-slack-messages.tool'
import { getSlackChannelTool } from './tools/get-slack-channel.tool'
import { getSlackMessageThreadTool } from './tools/get-slack-message-thread.tool'
import { getSlackUserTool } from './tools/get-slack-user.tool'
import { listSlackChannelsTool } from './tools/list-slack-channels.tool'
import { replyInSlackThreadTool } from './tools/reply-in-slack-thread.tool'
import { searchSlackMessagesTool } from './tools/search-slack-messages.tool'
import { sendSlackMessageTool } from './tools/send-slack-message.tool'
import { slackBlockCreateChannelTool } from './tools/slack-block-create-channel.tool'
import { slackBlockDeleteMessageTool } from './tools/slack-block-delete-message.tool'
import { slackBlockGetChannelTool } from './tools/slack-block-get-channel.tool'
import { slackBlockSendMessageTool } from './tools/slack-block-send-message.tool'
import { slackToolsets } from './tools/toolsets'
import { appMentionTrigger } from './triggers/app-mention/app-mention.workflow'

/**
 * Slack app configuration.
 */
export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },

  workflow: {
    blocks: [slackBlock],
    triggers: [appMentionTrigger],
  },

  tools: [
    listSlackChannelsTool,
    findSlackChannelTool,
    getSlackChannelTool,
    findSlackUserTool,
    getSlackUserTool,
    searchSlackMessagesTool,
    getSlackMessageThreadTool,
    getRecentSlackMessagesTool,
    sendSlackMessageTool,
    replyInSlackThreadTool,
    addSlackReactionTool,
    // Internal tools — back the Slack block's dispatcher, no agent/action surface.
    slackBlockCreateChannelTool,
    slackBlockGetChannelTool,
    slackBlockSendMessageTool,
    slackBlockDeleteMessageTool,
  ],
  toolsets: slackToolsets,
}

/**
 * Main App Component — rendered on the app's page in Auxx.
 */
export function App() {
  return (
    <>
      <TextBlock align="center">Slack</TextBlock>

      <TextBlock align="left">
        Send messages, manage channels, and look up users in your Slack workspace directly from Auxx
        workflows.
      </TextBlock>

      <TextBlock align="left">
        Connect your Slack workspace in Settings → Connections, then use the Slack workflow blocks
        to automate your support workflows.
      </TextBlock>
    </>
  )
}
