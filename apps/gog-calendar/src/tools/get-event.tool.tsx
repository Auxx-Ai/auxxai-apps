// src/tools/get-event.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import getEventExecute from './get-event.tool.server'

export const getCalendarEventTool = defineTool({
  id: 'get_calendar_event',
  name: 'Get calendar event',
  description: 'Fetch a single Google Calendar event by id with full details.',
  icon: googleCalendarIcon,
  inputs: z.object({
    calendarId: z.string().describe('Calendar id. Use list_my_calendars if unknown.'),
    eventId: z
      .string()
      .describe('Event id (returned from search_calendar_events or create_calendar_event).'),
    timeZone: z
      .string()
      .optional()
      .describe('IANA time zone for the response (e.g. America/Los_Angeles).'),
  }),
  outputs: z.object({
    eventId: z.string(),
    summary: z.string(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    start: z.string(),
    end: z.string(),
    allDay: z.boolean(),
    attendees: z.array(z.object({ email: z.string(), responseStatus: z.string() })),
    organizer: z.string().nullable(),
    status: z.string(),
    htmlLink: z.string(),
    recurrence: z.array(z.string()).describe('RRULE strings if recurring.'),
    conferenceData: z.object({ uri: z.string(), name: z.string() }).nullable(),
  }),
  exampleOutput: {
    eventId: 'a1b2c3d4e5f6',
    summary: 'Product sync',
    description: 'Weekly product team sync to review progress.',
    location: 'Conference Room A',
    start: '2026-06-10T15:00:00Z',
    end: '2026-06-10T16:00:00Z',
    allDay: false,
    attendees: [
      { email: 'jane@example.com', responseStatus: 'accepted' },
      { email: 'sam@example.com', responseStatus: 'needsAction' },
    ],
    organizer: 'jane@example.com',
    status: 'confirmed',
    htmlLink: 'https://www.google.com/calendar/event?eid=a1b2c3d4e5f6',
    recurrence: ['RRULE:FREQ=WEEKLY;COUNT=10'],
    conferenceData: {
      uri: 'https://meet.google.com/abc-defg-hij',
      name: 'Google Meet',
    },
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getEventExecute,
  agent: { toolsetSlug: 'gog-calendar.events' },
})
