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
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getEventExecute,
})
