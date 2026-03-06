// src/blocks/google-calendar/triggers/event-trigger/event-trigger.workflow.tsx

import type { WorkflowTrigger } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  useWorkflowNode,
} from '@auxx/sdk/client'
import googleCalendarIcon from '../../../../assets/icon.png'
import { EventTriggerPanel } from './event-trigger-panel'
import { eventTriggerSchema } from './event-trigger-schema'
import eventTriggerExecute from './event-trigger.server'

const triggerLabels: Record<string, string> = {
  eventCreated: 'Event Created',
  eventUpdated: 'Event Updated',
  eventCancelled: 'Event Cancelled',
  eventStarted: 'Event Started',
  eventEnded: 'Event Ended',
}

function EventTriggerNode() {
  const { data } = useWorkflowNode()
  const triggerOn = Array.isArray(data.triggerOn) ? data.triggerOn : [data.triggerOn]
  const label =
    triggerOn
      .map((v: string) => triggerLabels[v])
      .filter(Boolean)
      .join(' & ') || 'Calendar Trigger'

  return (
    <WorkflowNode>
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const eventTrigger = {
  id: 'gog-calendar.event-trigger',
  label: 'Google Calendar Trigger',
  description: 'Triggers when calendar events are created, updated, cancelled, started, or ended',
  icon: googleCalendarIcon,
  color: '#4285F4',
  schema: eventTriggerSchema,
  node: EventTriggerNode,
  panel: EventTriggerPanel,
  execute: eventTriggerExecute,
  config: {
    requiresConnection: true,
    polling: {
      intervalMinutes: 5,
      minIntervalMinutes: 1,
    },
  },
} satisfies WorkflowTrigger<typeof eventTriggerSchema>
