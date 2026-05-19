// src/blocks/supabase/supabase.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import supabaseIcon from '../../assets/icon.png'
import supabaseExecute from './supabase.server'
import { SupabasePanel } from './supabase-panel'
import { supabaseSchema } from './supabase-schema'
import { supabaseToolMap } from './tool-map'

export { supabaseSchema }

function SupabaseNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Supabase'
  let summary: string | undefined

  if (data.resource === 'row') {
    switch (data.operation) {
      case 'create':
        label = 'Create Row'
        break
      case 'delete':
        label = 'Delete Row'
        break
      case 'get':
        label = 'Get Row'
        break
      case 'getMany':
        label = 'Get Rows'
        break
      case 'update':
        label = 'Update Row'
        break
    }
    const tableField = `${data.operation}Table` as keyof typeof data
    const tableValue = data[tableField]
    if (typeof tableValue === 'string' && tableValue) summary = tableValue
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
 * The block's `toolMap` is the dispatch table the workflow runtime reads to
 * resolve each `(resource, operation)` pair to a tool id. Until the SDK's
 * `WorkflowBlock` type is widened to include `toolMap`, we cast the literal
 * through `unknown` so the extra property is preserved on the value.
 */
export const supabaseBlock = {
  id: 'supabase',
  label: 'Supabase',
  description:
    'Create, read, update, and delete rows in Supabase tables via the PostgREST API. Supports structured filters, raw PostgREST filter strings, and custom Postgres schemas.',
  category: 'action',
  icon: supabaseIcon,
  color: '#3ECF8E',
  schema: supabaseSchema,
  node: SupabaseNode,
  panel: SupabasePanel,
  config: {
    timeout: 30000,
    retries: 1,
    requiresConnection: true,
  },
  toolMap: supabaseToolMap,
  execute: supabaseExecute,
} as unknown as WorkflowBlock<typeof supabaseSchema> & {
  toolMap: typeof supabaseToolMap
}
