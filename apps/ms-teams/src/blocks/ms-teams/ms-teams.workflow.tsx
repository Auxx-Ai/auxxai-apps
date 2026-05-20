// src/blocks/ms-teams/ms-teams.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import msTeamsIcon from '../../assets/icon.png'
import msTeamsExecute from './ms-teams.server'
import { MsTeamsPanel } from './ms-teams-panel'
import { msTeamsSchema } from './ms-teams-schema'

export { msTeamsSchema }

function MsTeamsNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Microsoft Teams'
  let summary: string | undefined

  if (data.resource === 'channel') {
    switch (data.operation) {
      case 'create':
        label = 'Create Channel'
        summary = (data.channelCreateName as string) || undefined
        break
      case 'delete':
        label = 'Delete Channel'
        break
      case 'get':
        label = 'Get Channel'
        break
      case 'getMany':
        label = 'Get Channels'
        break
      case 'update':
        label = 'Update Channel'
        break
    }
  } else if (data.resource === 'channelMessage') {
    switch (data.operation) {
      case 'create':
        label = 'Send Channel Message'
        break
      case 'getMany':
        label = 'Get Channel Messages'
        break
    }
  } else if (data.resource === 'chatMessage') {
    switch (data.operation) {
      case 'create':
        label = 'Send Chat Message'
        break
      case 'get':
        label = 'Get Chat Message'
        break
      case 'getMany':
        label = 'Get Chat Messages'
        break
    }
  } else if (data.resource === 'task') {
    switch (data.operation) {
      case 'create':
        label = 'Create Task'
        summary = (data.taskCreateTitle as string) || undefined
        break
      case 'delete':
        label = 'Delete Task'
        break
      case 'get':
        label = 'Get Task'
        break
      case 'getMany':
        label = 'Get Tasks'
        break
      case 'update':
        label = 'Update Task'
        break
    }
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />

      <WorkflowNodeRow label={label} />

      {summary && (
        <WorkflowNodeText className="text-xs text-muted-foreground">{summary}</WorkflowNodeText>
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

/**
 * Maps `<resource>.<operation>` keys to the internal tool ids that back each
 * branch of the Microsoft Teams block. The block's dispatcher (`ms-teams.server.ts`)
 * uses this map plus `ctx.runTool` to invoke the correct tool per panel
 * selection. Keep this in sync with `resources/constants.ts` (`VALID_OPERATIONS`).
 */
export const msTeamsToolMap: Record<string, string> = {
  'channel.create': 'block_ms_teams_channel_create',
  'channel.delete': 'block_ms_teams_channel_delete',
  'channel.get': 'block_ms_teams_channel_get',
  'channel.getMany': 'block_ms_teams_channel_get_many',
  'channel.update': 'block_ms_teams_channel_update',
  'channelMessage.create': 'block_ms_teams_channel_message_create',
  'channelMessage.getMany': 'block_ms_teams_channel_message_get_many',
  'chatMessage.create': 'block_ms_teams_chat_message_create',
  'chatMessage.get': 'block_ms_teams_chat_message_get',
  'chatMessage.getMany': 'block_ms_teams_chat_message_get_many',
  'task.create': 'block_ms_teams_task_create',
  'task.delete': 'block_ms_teams_task_delete',
  'task.get': 'block_ms_teams_task_get',
  'task.getMany': 'block_ms_teams_task_get_many',
  'task.update': 'block_ms_teams_task_update',
}

export const msTeamsBlock = {
  id: 'ms-teams',
  label: 'Microsoft Teams',
  description:
    'Interact with Microsoft Teams — manage channels, send messages, and create Planner tasks',
  category: 'action',
  icon: msTeamsIcon,
  color: '#6264A7',
  schema: msTeamsSchema,
  node: MsTeamsNode,
  panel: MsTeamsPanel,
  execute: msTeamsExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
  toolMap: msTeamsToolMap,
} satisfies WorkflowBlock<typeof msTeamsSchema>
