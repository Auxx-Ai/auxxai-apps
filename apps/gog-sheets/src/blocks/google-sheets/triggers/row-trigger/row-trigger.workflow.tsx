// src/blocks/google-sheets/triggers/row-trigger/row-trigger.workflow.tsx

import type { WorkflowTrigger } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  useWorkflowNode,
} from '@auxx/sdk/client'
import googleSheetsIcon from '../../../../assets/icon.png'
import { RowTriggerPanel } from './row-trigger-panel'
import { rowTriggerSchema } from './row-trigger-schema'
import rowTriggerExecute from './row-trigger.server'

const triggerLabels: Record<string, string> = {
  rowAdded: 'Row Added',
  rowUpdated: 'Row Updated',
  anyUpdate: 'Row Changed',
}

function RowTriggerNode() {
  const { data } = useWorkflowNode()
  const label = triggerLabels[data.triggerOn as string] || 'Sheets Trigger'

  return (
    <WorkflowNode>
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const rowTrigger = {
  id: 'gog-sheets.row-trigger',
  label: 'Google Sheets Trigger',
  description: 'Triggers when rows are added or updated in a Google Sheet',
  icon: googleSheetsIcon,
  color: '#0F9D58',
  schema: rowTriggerSchema,
  node: RowTriggerNode,
  panel: RowTriggerPanel,
  execute: rowTriggerExecute,
  config: {
    requiresConnection: true,
    polling: {
      intervalMinutes: 5,
      minIntervalMinutes: 1,
    },
  },
} satisfies WorkflowTrigger<typeof rowTriggerSchema>
