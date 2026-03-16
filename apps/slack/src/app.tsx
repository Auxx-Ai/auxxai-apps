// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { slackBlock } from './blocks/slack/slack.workflow'

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
    triggers: [],
  },
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
        Connect your Slack workspace in Settings → Connections, then use the Slack workflow blocks to
        automate your support workflows.
      </TextBlock>
    </>
  )
}
