// src/triggers/app-mention/app-mention.workflow.tsx

import type { WorkflowTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import slackIcon from '../../assets/icon.png'
import { AppMentionPanel } from './app-mention-panel'
import { appMentionSchema } from './app-mention-schema'
import appMentionExecute from './app-mention.server'

function AppMentionNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="Slack: App Mention" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const appMentionTrigger = {
  id: 'slack.app-mention',
  label: 'Slack: App Mention',
  description: 'Fires when someone @-mentions the Auxx bot in a Slack channel.',
  icon: slackIcon,
  color: '#4A154B',
  schema: appMentionSchema,
  node: AppMentionNode,
  panel: AppMentionPanel,
  execute: appMentionExecute,
  config: {
    timeout: 5000,
    retries: 0,
    requiresConnection: true,
  },
} satisfies WorkflowTrigger<typeof appMentionSchema>
