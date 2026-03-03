// src/blocks/notion/notion.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import notionIcon from '../../assets/icon.png'
import notionExecute from './notion.server'
import { NotionPanel } from './notion-panel'
import { notionSchema } from './notion-schema'

export { notionSchema }

function NotionNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Notion'
  let summary: string | undefined

  if (data.resource === 'databasePage') {
    switch (data.operation) {
      case 'create':
        label = 'Create Database Page'
        break
      case 'get':
        label = 'Get Database Page'
        break
      case 'getMany':
        label = 'Query Database'
        break
      case 'update':
        label = 'Update Database Page'
        break
    }
  } else if (data.resource === 'page') {
    switch (data.operation) {
      case 'archive':
        label = 'Archive Page'
        break
      case 'create':
        label = 'Create Page'
        break
      case 'search':
        label = 'Search Pages'
        break
    }
  } else if (data.resource === 'block') {
    switch (data.operation) {
      case 'append':
        label = 'Append Blocks'
        break
      case 'getChildren':
        label = 'Get Block Children'
        break
    }
  } else if (data.resource === 'database') {
    switch (data.operation) {
      case 'get':
        label = 'Get Database'
        break
      case 'getMany':
        label = 'Get Databases'
        break
      case 'search':
        label = 'Search Databases'
        break
    }
  } else if (data.resource === 'user') {
    switch (data.operation) {
      case 'get':
        label = 'Get User'
        break
      case 'getMany':
        label = 'Get Users'
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

export const notionBlock = {
  id: 'notion',
  label: 'Notion',
  description:
    'Create, read, update, and query pages and databases in Notion. Supports database page CRUD, search, block content management, and user lookup.',
  category: 'action',
  icon: notionIcon,
  color: '#000000',
  schema: notionSchema,
  node: NotionNode,
  panel: NotionPanel,
  execute: notionExecute,
  config: {
    timeout: 30000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof notionSchema>
