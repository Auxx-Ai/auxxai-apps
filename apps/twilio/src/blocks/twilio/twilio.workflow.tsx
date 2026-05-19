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

/**
 * `toolMap` is read by the lambda runtime to route block execute calls into
 * internal tools (`ctx.runTool(toolId, input)`). The SDK's `WorkflowBlock`
 * type does not yet declare this field, so the literal is widened via cast
 * — the build's catalog scanner consumes it duck-typed.
 */
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
  toolMap: {
    'sms.send': '_twilio_block_send_sms',
    'call.make': '_twilio_block_make_call',
  },
  execute: twilioExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} as unknown as WorkflowBlock<typeof twilioSchema> & {
  toolMap: Record<string, string>
}
