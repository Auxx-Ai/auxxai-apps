// src/tools/update-event.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import updateEventExecute from './update-event.tool.server'

export const updateCalendarEventTool = defineTool({
  id: 'update_calendar_event',
  name: 'Update calendar event',
  description:
    'Patch fields on an existing Google Calendar event. Only fields included in `patch` are changed; attendees are added/removed incrementally to avoid dropping invitees.',
  icon: googleCalendarIcon,
  inputs: z.object({
    calendarId: z.string(),
    eventId: z.string(),
    patch: z
      .object({
        summary: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        start: z
          .string()
          .optional()
          .describe('New start time (ISO 8601 with explicit UTC offset).'),
        end: z.string().optional().describe('New end time (ISO 8601 with explicit UTC offset).'),
        allDay: z.boolean().optional(),
        addAttendees: z
          .array(z.string().email())
          .optional()
          .describe('Emails to add. Existing attendees preserved.'),
        removeAttendees: z
          .array(z.string().email())
          .optional()
          .describe('Emails to remove. Existing attendees not listed are preserved.'),
        recurrence: z
          .string()
          .nullable()
          .optional()
          .describe('RRULE string, or null to remove recurrence.'),
      })
      .describe('Fields to change. Only included fields are updated.'),
    sendUpdates: z.enum(['none', 'all', 'externalOnly']).optional(),
  }),
  outputs: z.object({
    eventId: z.string(),
    htmlLink: z.string(),
    start: z.string(),
    end: z.string(),
    attendees: z.array(z.object({ email: z.string(), responseStatus: z.string() })),
  }),
  exampleOutput: {
    eventId: 'a1b2c3d4e5f6',
    htmlLink: 'https://www.google.com/calendar/event?eid=a1b2c3d4e5f6',
    start: '2026-06-10T15:00:00Z',
    end: '2026-06-10T16:00:00Z',
    attendees: [
      { email: 'jane@example.com', responseStatus: 'accepted' },
      { email: 'sam@example.com', responseStatus: 'needsAction' },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: updateEventExecute,
  agent: { toolsetSlug: 'gog-calendar.events' },
})
