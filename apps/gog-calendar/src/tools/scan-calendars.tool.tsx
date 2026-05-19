// src/tools/scan-calendars.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import scanCalendarsExecute from './scan-calendars.tool.server'

const CalendarSummary = z.object({
  calendarId: z.string().describe('Google Calendar id (e.g. "primary" or an email).'),
  busyCount: z.number().int().describe('Number of busy intervals found in the window.'),
  totalBusyMinutes: z.number().int().describe('Total minutes marked busy on this calendar.'),
})

export const scanCalendarsTool = defineTool({
  id: 'scan_calendar_busy',
  name: 'Scan calendars for busy time',
  description:
    'Sequentially scan a list of Google Calendars within a time window and report busy intervals per calendar. Streams progress as each calendar finishes — useful when checking many calendars at once.',
  icon: googleCalendarIcon,
  inputs: z.object({
    calendarIds: z
      .array(z.string())
      .min(1)
      .describe('Calendar ids to scan in order. Use "primary" for the user\'s main calendar.'),
    timeMin: z.string().describe('Window start (ISO 8601).'),
    timeMax: z.string().describe('Window end (ISO 8601).'),
    timeZone: z
      .string()
      .optional()
      .describe('IANA time zone for the response (e.g. America/Los_Angeles).'),
  }),
  outputs: z.object({
    perCalendar: z.array(CalendarSummary).describe('One summary row per scanned calendar.'),
    totalBusyIntervals: z
      .number()
      .int()
      .describe('Aggregate busy interval count across every calendar scanned.'),
  }),
  config: {
    requiresConnection: true,
    streaming: true,
    // Streaming tools have a higher hard cap (120s) per plans/kopilot/apps/README.md §10;
    // this tool typically completes in <2s per calendar, so 30s is plenty for a fan-out.
    timeout: 30000,
  },
  execute: scanCalendarsExecute,
})
