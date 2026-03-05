// src/blocks/whatsapp/whatsapp.workflow.tsx

import type { WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  WorkflowNodeText,
  useWorkflowNode,
} from '@auxx/sdk/client'
import whatsappIcon from '../../assets/icon.png'
import { WhatsappPanel } from './whatsapp-panel'
import { whatsappSchema } from './whatsapp-schema'
import whatsappExecute from './whatsapp.server'

export { whatsappSchema }

function WhatsappNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'WhatsApp'

  if (data.resource === 'message') {
    switch (data.operation) {
      case 'sendText':
        label = 'Send Text Message'
        break
      case 'sendMedia':
        label = 'Send Media'
        break
      case 'sendTemplate':
        label = 'Send Template'
        break
      case 'sendContacts':
        label = 'Send Contact Card'
        break
      case 'sendLocation':
        label = 'Send Location'
        break
    }
  } else if (data.resource === 'media') {
    switch (data.operation) {
      case 'upload':
        label = 'Upload Media'
        break
      case 'getUrl':
        label = 'Get Media URL'
        break
      case 'delete':
        label = 'Delete Media'
        break
    }
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      {status === 'error' && lastRun?.error && (
        <WorkflowNodeText className="text-xs text-destructive">
          Error: {lastRun.error.message}
        </WorkflowNodeText>
      )}
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const whatsappBlock = {
  id: 'whatsapp',
  label: 'WhatsApp',
  description: 'Send messages and manage media via WhatsApp Business API',
  category: 'action',
  icon: whatsappIcon,
  color: '#25D366',
  schema: whatsappSchema,
  node: WhatsappNode,
  panel: WhatsappPanel,
  execute: whatsappExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof whatsappSchema>
