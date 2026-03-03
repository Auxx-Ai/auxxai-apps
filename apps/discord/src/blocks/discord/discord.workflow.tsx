// src/blocks/discord/discord.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import discordIcon from '../../assets/icon.png'
import discordExecute from './discord.server'
import { DiscordPanel } from './discord-panel'
import { discordSchema } from './discord-schema'

export { discordSchema }

function DiscordNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Discord'
  let summary: string | undefined

  if (data.resource === 'channel') {
    switch (data.operation) {
      case 'create':
        label = 'Create Channel'
        summary = (data.createName as string) || undefined
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
  } else if (data.resource === 'message') {
    switch (data.operation) {
      case 'send':
        label = 'Send Message'
        break
      case 'delete':
        label = 'Delete Message'
        break
      case 'get':
        label = 'Get Message'
        break
      case 'getMany':
        label = 'Get Messages'
        break
      case 'react':
        label = 'React to Message'
        break
    }
  } else if (data.resource === 'member') {
    switch (data.operation) {
      case 'getMany':
        label = 'Get Members'
        break
      case 'roleAdd':
        label = 'Add Role'
        break
      case 'roleRemove':
        label = 'Remove Role'
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

      {data.resource === 'message' && data.operation === 'send' && data.sendContent && (
        <WorkflowNodeText className="text-xs">
          {(data.sendContent as string).length > 40
            ? `${(data.sendContent as string).substring(0, 40)}...`
            : data.sendContent}
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

export const discordBlock = {
  id: 'discord',
  label: 'Discord',
  description: 'Interact with Discord — send messages, manage channels, and manage member roles',
  category: 'action',
  icon: discordIcon,
  color: '#5865F2',
  schema: discordSchema,
  node: DiscordNode,
  panel: DiscordPanel,
  execute: discordExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof discordSchema>
