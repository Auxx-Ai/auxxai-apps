// src/blocks/google-sheets/google-sheets.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import googleSheetsIcon from '../../assets/icon.png'
import googleSheetsExecute from './google-sheets.server'
import { GoogleSheetsPanel } from './google-sheets-panel'
import { googleSheetsSchema } from './google-sheets-schema'

export { googleSheetsSchema }

function GoogleSheetsNode() {
  const { data } = useWorkflowNode()

  let label = 'Google Sheets'

  if (data.resource === 'spreadsheet') {
    if (data.operation === 'create') label = 'Create Spreadsheet'
    else if (data.operation === 'delete') label = 'Delete Spreadsheet'
  } else if (data.resource === 'sheet') {
    if (data.operation === 'appendRow') label = 'Append Row'
    else if (data.operation === 'clear') label = 'Clear Sheet'
    else if (data.operation === 'createSheet') label = 'Create Sheet'
    else if (data.operation === 'deleteSheet') label = 'Delete Sheet'
    else if (data.operation === 'deleteRowsOrColumns') label = 'Delete Rows/Columns'
    else if (data.operation === 'getRows') label = 'Get Rows'
    else if (data.operation === 'updateRow') label = 'Update Row'
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const googleSheetsBlock = {
  id: 'google-sheets',
  label: 'Google Sheets',
  description: 'Interact with Google Sheets — read, write, and manage spreadsheets',
  category: 'action',
  icon: googleSheetsIcon,
  color: '#0F9D58',
  schema: googleSheetsSchema,
  node: GoogleSheetsNode,
  panel: GoogleSheetsPanel,
  execute: googleSheetsExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof googleSheetsSchema>
