// src/blocks/whatsapp/triggers/message-received/message-received.workflow.tsx

import type { WorkflowTrigger } from '@auxx/sdk'
import { WorkflowNode, WorkflowNodeHandle, WorkflowNodeRow } from '@auxx/sdk/client'
import whatsappIcon from '../../../../assets/icon.png'
import { MessageReceivedPanel } from './message-received-panel'
import { messageReceivedSchema } from './message-received-schema'
import messageReceivedExecute from './message-received.server'

function MessageReceivedNode() {
  return (
    <WorkflowNode>
      <WorkflowNodeRow label="Message Received" />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const messageReceivedTrigger = {
  id: 'whatsapp.message-received',
  label: 'Message Received',
  description: 'Triggers when a WhatsApp message is received',
  icon: whatsappIcon,
  color: '#25D366',
  schema: messageReceivedSchema,
  node: MessageReceivedNode,
  panel: MessageReceivedPanel,
  execute: messageReceivedExecute,
  config: {
    timeout: 5000,
    retries: 0,
    requiresConnection: true,
  },
} satisfies WorkflowTrigger<typeof messageReceivedSchema>
