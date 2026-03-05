// src/blocks/google-calendar/resources/event/event-schema.ts

import { Workflow } from '@auxx/sdk'

export const eventInputs = {
  // --- Shared: Calendar selector (used by all event operations) ---
  eventCalendar: Workflow.select({
    label: 'Calendar',
    description: 'Calendar to operate on',
    options: [] as { value: string; label: string }[],
  }),

  // --- Event: Create ---
  createSummary: Workflow.string({
    label: 'Title',
    description: 'Title of the event',
    placeholder: 'Team Meeting',
    acceptsVariables: true,
  }),
  createStart: Workflow.string({
    label: 'Start Time',
    description: 'Start time (ISO 8601)',
    placeholder: '2026-03-04T09:00:00Z',
    acceptsVariables: true,
  }),
  createEnd: Workflow.string({
    label: 'End Time',
    description: 'End time (ISO 8601)',
    placeholder: '2026-03-04T10:00:00Z',
    acceptsVariables: true,
  }),
  createAllDay: Workflow.select({
    label: 'All Day',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
    default: 'no',
  }),
  createDescription: Workflow.string({
    label: 'Description',
    placeholder: 'Event description...',
    acceptsVariables: true,
  }),
  createLocation: Workflow.string({
    label: 'Location',
    placeholder: 'Conference Room A',
    acceptsVariables: true,
  }),
  createAttendees: Workflow.string({
    label: 'Attendees',
    description: 'Comma-separated email addresses',
    placeholder: 'alice@example.com, bob@example.com',
    acceptsVariables: true,
  }),
  createColor: Workflow.select({
    label: 'Color',
    description: 'Event color (Google Calendar color ID)',
    options: [
      { value: '', label: 'Default' },
      { value: '1', label: 'Lavender' },
      { value: '2', label: 'Sage' },
      { value: '3', label: 'Grape' },
      { value: '4', label: 'Flamingo' },
      { value: '5', label: 'Banana' },
      { value: '6', label: 'Tangerine' },
      { value: '7', label: 'Peacock' },
      { value: '8', label: 'Graphite' },
      { value: '9', label: 'Blueberry' },
      { value: '10', label: 'Basil' },
      { value: '11', label: 'Tomato' },
    ],
    default: '',
  }),
  createVisibility: Workflow.select({
    label: 'Visibility',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
    ],
    default: 'default',
  }),
  createShowMeAs: Workflow.select({
    label: 'Show Me As',
    options: [
      { value: 'opaque', label: 'Busy' },
      { value: 'transparent', label: 'Available' },
    ],
    default: 'opaque',
  }),
  createSendUpdates: Workflow.select({
    label: 'Send Updates',
    description: 'Who should receive notifications about this event',
    options: [
      { value: 'none', label: 'None' },
      { value: 'all', label: 'All' },
      { value: 'externalOnly', label: 'External Only' },
    ],
    default: 'none',
  }),
  createGuestsCanModify: Workflow.select({
    label: 'Guests Can Modify',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  createGuestsCanInviteOthers: Workflow.select({
    label: 'Guests Can Invite Others',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: 'true',
  }),
  createGuestsCanSeeOtherGuests: Workflow.select({
    label: 'Guests Can See Other Guests',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: 'true',
  }),
  createRecurrence: Workflow.string({
    label: 'Recurrence Rule (RRULE)',
    description: 'e.g. FREQ=WEEKLY;COUNT=10 — leave blank for non-recurring events',
    placeholder: 'FREQ=WEEKLY;INTERVAL=2;COUNT=10',
    acceptsVariables: true,
  }),
  createConferenceSolution: Workflow.select({
    label: 'Conference',
    description: 'Add a video conference link',
    options: [
      { value: '', label: 'None' },
      { value: 'hangoutsMeet', label: 'Google Meet' },
    ],
    default: '',
  }),

  // --- Event: Delete ---
  deleteEventId: Workflow.string({
    label: 'Event ID',
    description: 'ID of the event to delete',
    acceptsVariables: true,
  }),
  deleteSendUpdates: Workflow.select({
    label: 'Send Updates',
    options: [
      { value: 'none', label: 'None' },
      { value: 'all', label: 'All' },
      { value: 'externalOnly', label: 'External Only' },
    ],
    default: 'none',
  }),

  // --- Event: Get ---
  getEventId: Workflow.string({
    label: 'Event ID',
    description: 'ID of the event to retrieve',
    acceptsVariables: true,
  }),
  getTimezone: Workflow.string({
    label: 'Timezone',
    description: 'Timezone for the response',
    placeholder: 'America/New_York',
    acceptsVariables: true,
  }),

  // --- Event: Get Many ---
  getManyAfter: Workflow.string({
    label: 'After',
    description: 'Return events after this time (ISO 8601)',
    placeholder: '2026-03-04T00:00:00Z',
    acceptsVariables: true,
  }),
  getManyBefore: Workflow.string({
    label: 'Before',
    description: 'Return events before this time (ISO 8601)',
    placeholder: '2026-03-11T00:00:00Z',
    acceptsVariables: true,
  }),
  getManyLimit: Workflow.select({
    label: 'Limit',
    description: 'Maximum number of events to return',
    options: [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '250', label: '250' },
    ],
    default: '50',
  }),
  getManyQuery: Workflow.string({
    label: 'Search Query',
    description: 'Free text search across event fields',
    placeholder: 'team meeting',
    acceptsVariables: true,
  }),
  getManyShowDeleted: Workflow.select({
    label: 'Show Deleted',
    options: [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: 'false',
  }),
  getManyOrderBy: Workflow.select({
    label: 'Order By',
    options: [
      { value: 'startTime', label: 'Start Time' },
      { value: 'updated', label: 'Last Updated' },
    ],
    default: 'startTime',
  }),
  getManyExpandRecurring: Workflow.select({
    label: 'Expand Recurring Events',
    description: 'Expand recurring events into individual instances',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: 'true',
  }),
  getManyTimezone: Workflow.string({
    label: 'Timezone',
    description: 'Timezone for the response',
    placeholder: 'America/New_York',
    acceptsVariables: true,
  }),

  // --- Event: Update ---
  updateEventId: Workflow.string({
    label: 'Event ID',
    description: 'ID of the event to update',
    acceptsVariables: true,
  }),
  updateSummary: Workflow.string({
    label: 'Title',
    acceptsVariables: true,
  }),
  updateStart: Workflow.string({
    label: 'Start Time',
    description: 'New start time (ISO 8601)',
    acceptsVariables: true,
  }),
  updateEnd: Workflow.string({
    label: 'End Time',
    description: 'New end time (ISO 8601)',
    acceptsVariables: true,
  }),
  updateAllDay: Workflow.select({
    label: 'All Day',
    options: [
      { value: '', label: 'No Change' },
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    default: '',
  }),
  updateDescription: Workflow.string({
    label: 'Description',
    acceptsVariables: true,
  }),
  updateLocation: Workflow.string({
    label: 'Location',
    acceptsVariables: true,
  }),
  updateAttendees: Workflow.string({
    label: 'Attendees',
    description: 'Comma-separated email addresses (replaces existing attendees)',
    acceptsVariables: true,
  }),
  updateColor: Workflow.select({
    label: 'Color',
    options: [
      { value: '', label: 'No Change' },
      { value: '1', label: 'Lavender' },
      { value: '2', label: 'Sage' },
      { value: '3', label: 'Grape' },
      { value: '4', label: 'Flamingo' },
      { value: '5', label: 'Banana' },
      { value: '6', label: 'Tangerine' },
      { value: '7', label: 'Peacock' },
      { value: '8', label: 'Graphite' },
      { value: '9', label: 'Blueberry' },
      { value: '10', label: 'Basil' },
      { value: '11', label: 'Tomato' },
    ],
    default: '',
  }),
  updateVisibility: Workflow.select({
    label: 'Visibility',
    options: [
      { value: '', label: 'No Change' },
      { value: 'default', label: 'Default' },
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' },
    ],
    default: '',
  }),
  updateShowMeAs: Workflow.select({
    label: 'Show Me As',
    options: [
      { value: '', label: 'No Change' },
      { value: 'opaque', label: 'Busy' },
      { value: 'transparent', label: 'Available' },
    ],
    default: '',
  }),
  updateSendUpdates: Workflow.select({
    label: 'Send Updates',
    options: [
      { value: 'none', label: 'None' },
      { value: 'all', label: 'All' },
      { value: 'externalOnly', label: 'External Only' },
    ],
    default: 'none',
  }),
  updateGuestsCanModify: Workflow.select({
    label: 'Guests Can Modify',
    options: [
      { value: '', label: 'No Change' },
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' },
    ],
    default: '',
  }),
  updateGuestsCanInviteOthers: Workflow.select({
    label: 'Guests Can Invite Others',
    options: [
      { value: '', label: 'No Change' },
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: '',
  }),
  updateGuestsCanSeeOtherGuests: Workflow.select({
    label: 'Guests Can See Other Guests',
    options: [
      { value: '', label: 'No Change' },
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
    default: '',
  }),
  updateRecurrence: Workflow.string({
    label: 'Recurrence Rule (RRULE)',
    description: 'New recurrence rule. Leave blank to keep existing.',
    acceptsVariables: true,
  }),
}

export function eventComputeOutputs(operation: string) {
  if (operation === 'create' || operation === 'get' || operation === 'update') {
    return {
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
  }
  if (operation === 'delete') {
    return {
      success: Workflow.string({ label: 'Success' }),
    }
  }
  if (operation === 'getMany') {
    return {
      events: Workflow.string({ label: 'Events (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
