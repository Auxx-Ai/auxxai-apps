// src/blocks/google-calendar/google-calendar.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import googleCalendarIcon from '../../assets/icon.png'
import googleCalendarExecute from './google-calendar.server'
import { GoogleCalendarPanel } from './google-calendar-panel'
import { googleCalendarSchema } from './google-calendar-schema'

export { googleCalendarSchema }

function GoogleCalendarNode() {
  const { data } = useWorkflowNode()

  let label = 'Google Calendar'

  if (data.resource === 'calendar') {
    if (data.operation === 'checkAvailability') label = 'Check Availability'
  } else if (data.resource === 'event') {
    if (data.operation === 'create') label = 'Create Event'
    else if (data.operation === 'delete') label = 'Delete Event'
    else if (data.operation === 'get') label = 'Get Event'
    else if (data.operation === 'getMany') label = 'Get Events'
    else if (data.operation === 'update') label = 'Update Event'
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const googleCalendarBlock = {
  id: 'google-calendar',
  label: 'Google Calendar',
  description: 'Manage Google Calendar events — create, update, delete, and check availability',
  category: 'action',
  icon: googleCalendarIcon,
  color: '#4285F4',
  schema: googleCalendarSchema,
  node: GoogleCalendarNode,
  panel: GoogleCalendarPanel,
  execute: googleCalendarExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof googleCalendarSchema>
