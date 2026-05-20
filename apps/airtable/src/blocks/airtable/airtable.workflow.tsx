// src/blocks/airtable/airtable.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import airtableIcon from '../../assets/icon.png'
import airtableExecute from './airtable.server'
import { AirtablePanel } from './airtable-panel'
import { airtableSchema } from './airtable-schema'

export { airtableSchema }

function AirtableNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Airtable'
  let summary: string | undefined

  if (data.resource === 'record') {
    switch (data.operation) {
      case 'create':
        label = 'Create Record'
        break
      case 'delete':
        label = 'Delete Record'
        break
      case 'get':
        label = 'Get Record'
        break
      case 'search':
        label = 'Search Records'
        break
      case 'update':
        label = 'Update Record'
        break
      case 'upsert':
        label = 'Upsert Record'
        break
    }
  } else if (data.resource === 'base') {
    switch (data.operation) {
      case 'getMany':
        label = 'Get Bases'
        break
      case 'getSchema':
        label = 'Get Schema'
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
 * Dispatcher table: `<resource>.<operation>` -> internal tool id. The runtime
 * reads this from the catalog and routes block executes through the unified
 * `__AUXX_TOOLS__` registry. See impl plan §6.3 / §7.4.
 */
export const airtableBlockToolMap = {
  'base.getMany': 'airtable_block_get_bases',
  'base.getSchema': 'airtable_block_get_schema',
  'record.create': 'airtable_block_create_record',
  'record.delete': 'airtable_block_delete_record',
  'record.get': 'airtable_block_get_record',
  'record.search': 'airtable_block_search_records',
  'record.update': 'airtable_block_update_record',
  'record.upsert': 'airtable_block_upsert_record',
} as const

export const airtableBlock = {
  id: 'airtable',
  label: 'Airtable',
  description:
    'Create, read, update, and delete records in Airtable bases. Supports record CRUD, search with filters, upsert, and base schema introspection.',
  category: 'action',
  icon: airtableIcon,
  color: '#18BFFF',
  schema: airtableSchema,
  node: AirtableNode,
  panel: AirtablePanel,
  execute: airtableExecute,
  config: {
    timeout: 30000,
    retries: 1,
    requiresConnection: true,
  },
  toolMap: airtableBlockToolMap,
} satisfies WorkflowBlock<typeof airtableSchema> & {
  toolMap: Record<string, string>
}
