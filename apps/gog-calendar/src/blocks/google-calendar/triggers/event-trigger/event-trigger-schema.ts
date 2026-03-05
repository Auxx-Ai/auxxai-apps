// src/blocks/google-calendar/triggers/event-trigger/event-trigger-schema.ts

import { Workflow } from '@auxx/sdk'

export const eventTriggerInputs = {
  calendarId: Workflow.select({
    label: 'Calendar',
    description: 'Calendar to watch for events',
    options: [] as { value: string; label: string }[],
  }),
  triggerOn: Workflow.select({
    label: 'Trigger On',
    options: [
      { value: 'eventCreated', label: 'Event Created' },
      { value: 'eventUpdated', label: 'Event Updated' },
      { value: 'eventCancelled', label: 'Event Cancelled' },
      { value: 'eventStarted', label: 'Event Started' },
      { value: 'eventEnded', label: 'Event Ended' },
    ],
    default: 'eventCreated',
  }),
  matchTerm: Workflow.string({
    label: 'Filter Term',
    description: 'Optional text to filter events by (searches all fields)',
    placeholder: 'team meeting',
    acceptsVariables: true,
  }),
}

export const eventTriggerOutputs = {
  eventId: Workflow.string({ label: 'Event ID' }),
  summary: Workflow.string({ label: 'Title' }),
  description: Workflow.string({ label: 'Description' }),
  location: Workflow.string({ label: 'Location' }),
  start: Workflow.string({ label: 'Start' }),
  end: Workflow.string({ label: 'End' }),
  status: Workflow.string({ label: 'Status' }),
  htmlLink: Workflow.string({ label: 'Event URL' }),
  attendees: Workflow.string({ label: 'Attendees (JSON)' }),
  organizer: Workflow.string({ label: 'Organizer' }),
  created: Workflow.string({ label: 'Created' }),
  updated: Workflow.string({ label: 'Updated' }),
}

export const eventTriggerSchema = {
  inputs: eventTriggerInputs,
  outputs: eventTriggerOutputs,
}
