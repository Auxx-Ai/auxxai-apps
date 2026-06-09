// src/tools/create-event.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import createEventExecute from './create-event.tool.server'

export const createCalendarEventTool = defineTool({
  id: 'create_calendar_event',
  name: 'Create calendar event',
  description:
    'Create a new event on a Google Calendar. Use list_my_calendars first if the user has not named a calendar explicitly.',
  icon: googleCalendarIcon,
  inputs: z.object({
    calendarId: z.string().describe('Calendar id. Use list_my_calendars if unknown.'),
    summary: z.string().describe('Event title.'),
    start: z
      .string()
      .describe('Start time (ISO 8601 with explicit UTC offset, e.g. ...Z or ...+02:00).'),
    end: z
      .string()
      .describe('End time (ISO 8601 with explicit UTC offset, e.g. ...Z or ...+02:00).'),
    allDay: z
      .boolean()
      .optional()
      .describe('True for all-day events. start/end interpreted as dates.'),
    description: z.string().optional(),
    location: z.string().optional(),
    attendees: z.array(z.string().email()).optional().describe('Email addresses to invite.'),
    conferencing: z
      .enum(['none', 'meet'])
      .optional()
      .describe('Add Google Meet to the event. Default: none.'),
    sendUpdates: z
      .enum(['none', 'all', 'externalOnly'])
      .optional()
      .describe('Who to notify. Default: none.'),
    recurrence: z.string().optional().describe('RRULE string (e.g. FREQ=WEEKLY;COUNT=10).'),
  }),
  outputs: z.object({
    eventId: z.string(),
    calendarId: z.string(),
    htmlLink: z.string(),
    start: z.string(),
    end: z.string(),
    attendees: z.array(z.object({ email: z.string(), responseStatus: z.string() })),
    conferenceLink: z.string().nullable(),
  }),
  exampleOutput: {
    eventId: 'a1b2c3d4e5f6',
    calendarId: 'primary',
    htmlLink: 'https://www.google.com/calendar/event?eid=a1b2c3d4e5f6',
    start: '2026-06-10T15:00:00Z',
    end: '2026-06-10T16:00:00Z',
    attendees: [
      { email: 'jane@example.com', responseStatus: 'accepted' },
      { email: 'sam@example.com', responseStatus: 'needsAction' },
    ],
    conferenceLink: 'https://meet.google.com/abc-defg-hij',
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createEventExecute,
  agent: { toolsetSlug: 'gog-calendar.events' },
})
