// src/tools/search-events.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import searchEventsExecute from './search-events.tool.server'

const EventRow = z.object({
  eventId: z.string(),
  calendarId: z.string(),
  summary: z.string(),
  start: z.string(),
  end: z.string(),
  location: z.string().nullable(),
  attendees: z.array(z.object({ email: z.string(), responseStatus: z.string() })),
  htmlLink: z.string(),
})

export const searchCalendarEventsTool = defineTool({
  id: 'search_calendar_events',
  name: 'Search calendar events',
  description:
    'Search Google Calendar events across one or more calendars within a bounded time window. Use list_my_calendars first to discover calendar ids.',
  icon: googleCalendarIcon,
  inputs: z.object({
    calendarIds: z
      .array(z.string())
      .optional()
      .describe(
        'Calendar ids to search across. Defaults to the primary calendar. Use list_my_calendars to discover ids.'
      ),
    q: z
      .string()
      .optional()
      .describe('Free-text search across event titles, descriptions, locations, attendees.'),
    timeMin: z.string().describe('Window start (ISO 8601). Required.'),
    timeMax: z.string().describe('Window end (ISO 8601). Required.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum results to return per calendar. Default 25.'),
    orderBy: z.enum(['startTime', 'updated']).optional().describe('Sort order. Default startTime.'),
  }),
  outputs: z.object({
    events: z.array(EventRow),
    truncated: z
      .boolean()
      .describe('True if more results exist beyond the limit on at least one calendar.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchEventsExecute,
  agent: { toolsetSlug: 'gog-calendar.events' },
})
