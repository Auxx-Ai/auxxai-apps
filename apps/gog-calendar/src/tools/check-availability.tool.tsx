// src/tools/check-availability.tool.tsx

import { refs as _refs, defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import checkAvailabilityExecute from './check-availability.tool.server'

// `refs` is unused on this read-only tool but kept imported to ensure the
// surface is exercised by the first tool's bundle. (Wedge A's gate.)
void _refs

const TimeRange = z.object({
  start: z.string().describe('ISO 8601 timestamp for the start of the interval.'),
  end: z.string().describe('ISO 8601 timestamp for the end of the interval.'),
})

export const checkAvailabilityTool = defineTool({
  id: 'check_calendar_availability',
  name: 'Check calendar availability',
  description:
    'Find available meeting times on the connected Google Calendar account within a window. Returns busy intervals and a few free-slot suggestions of the requested length.',
  icon: googleCalendarIcon,
  inputs: z.object({
    calendarIds: z
      .array(z.string())
      .optional()
      .describe('Calendar ids to check. Defaults to the primary calendar.'),
    timeMin: z.string().describe('Window start (ISO 8601).'),
    timeMax: z.string().describe('Window end (ISO 8601).'),
    durationMinutes: z
      .number()
      .int()
      .min(5)
      .max(480)
      .optional()
      .describe('Duration of the desired slot in minutes. Default 30.'),
    timeZone: z
      .string()
      .optional()
      .describe('IANA time zone for the response (e.g. America/Los_Angeles).'),
  }),
  outputs: z.object({
    busy: z.array(TimeRange).describe('Busy intervals in the window.'),
    suggestions: z.array(TimeRange).describe('Free slots of the requested length.'),
  }),
  exampleOutput: {
    busy: [
      { start: '2026-06-10T15:00:00Z', end: '2026-06-10T16:00:00Z' },
      { start: '2026-06-10T18:30:00Z', end: '2026-06-10T19:00:00Z' },
    ],
    suggestions: [
      { start: '2026-06-10T16:00:00Z', end: '2026-06-10T16:30:00Z' },
      { start: '2026-06-10T17:00:00Z', end: '2026-06-10T17:30:00Z' },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: checkAvailabilityExecute,
  agent: { toolsetSlug: 'gog-calendar.availability' },
})
