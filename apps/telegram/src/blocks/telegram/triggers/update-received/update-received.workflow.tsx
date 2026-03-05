// src/blocks/telegram/triggers/update-received/update-received.workflow.tsx

import type { WorkflowTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import telegramIcon from '../../../../assets/icon.png'
import { UpdateReceivedPanel } from './update-received-panel'
import { updateReceivedSchema } from './update-received-schema'
import updateReceivedExecute from './update-received.server'

function UpdateReceivedNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="Update Received" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const updateReceivedTrigger = {
  id: 'telegram.update-received',
  label: 'Update Received',
  description: 'Triggers when the Telegram bot receives a message, callback query, or other update',
  icon: telegramIcon,
  color: '#0088CC',
  schema: updateReceivedSchema,
  node: UpdateReceivedNode,
  panel: UpdateReceivedPanel,
  execute: updateReceivedExecute,
  config: {
    timeout: 5000,
    retries: 0,
    requiresConnection: true,
  },
} satisfies WorkflowTrigger<typeof updateReceivedSchema>
