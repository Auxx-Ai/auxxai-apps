// src/blocks/twilio/twilio.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import twilioIcon from '../../assets/icon.png'
import twilioExecute from './twilio.server'
import { TwilioPanel } from './twilio-panel'
import { twilioSchema } from './twilio-schema'

export { twilioSchema }

// ============================================================================
// Node Component (Canvas Visualization)
// ============================================================================

function TwilioNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Twilio'
  let summary: string | undefined

  if (data.resource === 'sms') {
    switch (data.operation) {
      case 'send':
        label = 'Send SMS'
        summary = data.sendTo ? String(data.sendTo) : undefined
        break
    }
  } else if (data.resource === 'call') {
    switch (data.operation) {
      case 'make':
        label = 'Make Call'
        summary = data.makeTo ? String(data.makeTo) : undefined
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

// ============================================================================
// Workflow Block Export
// ============================================================================

export const twilioBlock = {
  id: 'twilio',
  label: 'Twilio',
  description: 'Send SMS messages and make phone calls with Twilio',
  category: 'action',
  icon: twilioIcon,
  color: '#F22F46',
  schema: twilioSchema,
  node: TwilioNode,
  panel: TwilioPanel,
  execute: twilioExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof twilioSchema>
