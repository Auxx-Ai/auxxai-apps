// src/blocks/google-calendar/google-calendar-schema.ts

import { Workflow, type WorkflowSchema } from '@auxx/sdk'
import { ALL_OPERATIONS } from './resources/constants'
import { calendarInputs, calendarComputeOutputs } from './resources/calendar/calendar-schema'
import { eventInputs, eventComputeOutputs } from './resources/event/event-schema'

export const googleCalendarSchema = {
  inputs: {
    resource: Workflow.select({
      label: 'Resource',
      options: [
        { value: 'calendar', label: 'Calendar' },
        { value: 'event', label: 'Event' },
      ],
      default: 'event',
    }),
    operation: Workflow.select({
      label: 'Operation',
      options: ALL_OPERATIONS as any,
      default: 'create',
    }),
    ...calendarInputs,
    ...eventInputs,
  },
  outputs: {},
  computeOutputs: (inputs: any) => {
    const { resource, operation } = inputs
    if (resource === 'calendar') return calendarComputeOutputs(operation)
    if (resource === 'event') return eventComputeOutputs(operation)
    return {}
  },
} satisfies WorkflowSchema
