// src/blocks/slack/slack.workflow.tsx

/**
 * Slack unified workflow block.
 *
 * Single block with Resource/Operation selectors — one app = one block.
 * Resources: Channel, Message
 * Operations vary per resource (see resources/constants.ts).
 */

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import slackIcon from '../../assets/icon.png'
import slackExecute from './slack.server'
import { SlackPanel } from './slack-panel'
import { slackSchema } from './slack-schema'

// Re-export for consumers
export { slackSchema }

// ============================================================================
// Node Component (Canvas Visualization)
// ============================================================================

function SlackNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Slack'
  let summary: string | undefined

  if (data.resource === 'channel') {
    if (data.operation === 'create') {
      label = 'Create Channel'
      summary = data.createChannelName || undefined
    } else if (data.operation === 'get') {
      label = 'Get Channel'
      if (data.getChannelMode === 'name' && data.getChannelName) {
        summary = `#${(data.getChannelName as string).replace(/^#/, '')}`
      } else if (data.getChannelMode === 'list' && data.getChannelList) {
        summary = 'Channel selected'
      } else if (data.getChannelMode === 'id' && data.getChannelId) {
        summary = data.getChannelId as string
      }
    }
  } else if (data.resource === 'message') {
    if (data.operation === 'send') {
      label = 'Send Message'
      if (data.sendTo === 'user') {
        if (data.userMode === 'email') summary = data.userEmail ? `@${data.userEmail}` : undefined
        else if (data.userMode === 'list') summary = data.userList ? 'User selected' : undefined
        else summary = data.user ? `@${data.user}` : undefined
      } else {
        if (data.channelMode === 'name')
          summary = data.channelName ? `#${(data.channelName as string).replace(/^#/, '')}` : undefined
        else if (data.channelMode === 'list') summary = data.channelList ? 'Channel selected' : undefined
        else if (data.channelMode === 'url') summary = data.channelUrl ? 'From URL' : undefined
        else summary = data.channel ? `#${data.channel}` : undefined
      }
    } else if (data.operation === 'delete') {
      label = 'Delete Message'
    }
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />

      <WorkflowNodeRow label={label} />

      {summary && (
        <WorkflowNodeText className="text-xs text-muted-foreground">
          {summary}
        </WorkflowNodeText>
      )}

      {data.resource === 'message' && data.operation === 'send' && data.text && (
        <WorkflowNodeText className="text-xs">
          {(data.text as string).length > 40 ? `${(data.text as string).substring(0, 40)}...` : data.text}
        </WorkflowNodeText>
      )}

      {status === 'error' && lastRun?.error && (
        <WorkflowNodeText className="text-xs text-destructive">
          Error: {lastRun.error.message}
        </WorkflowNodeText>
      )}

      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

// ============================================================================
// Workflow Block Export
// ============================================================================

export const slackBlock = {
  id: 'slack',
  label: 'Slack',
  description: 'Interact with Slack — send messages, manage channels, and more',
  category: 'action',
  icon: slackIcon,
  color: '#4A154B',
  schema: slackSchema,
  node: SlackNode,
  panel: SlackPanel,
  execute: slackExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof slackSchema>
