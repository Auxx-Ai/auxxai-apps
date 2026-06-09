// src/tools/list-my-calendars.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import listMyCalendarsExecute from './list-my-calendars.tool.server'

export const listMyCalendarsTool = defineTool({
  id: 'list_my_calendars',
  name: 'List available calendars',
  description:
    'List Google Calendars accessible on the connected account. Use this once before creating, updating, or searching events when the user has not named a calendar explicitly.',
  icon: googleCalendarIcon,
  inputs: z.object({}),
  outputs: z.object({
    calendars: z
      .array(
        z.object({
          calendarId: z.string().describe('Calendar id to use in subsequent tool calls.'),
          summary: z.string().describe('Human-readable calendar name.'),
          primary: z.boolean().describe("True for the connected user's primary calendar."),
          accessRole: z.string().describe('owner | writer | reader | freeBusyReader.'),
        })
      )
      .describe('All accessible calendars on the connected account.'),
  }),
  exampleOutput: {
    calendars: [
      {
        calendarId: 'primary',
        summary: 'Jane Cooper',
        primary: true,
        accessRole: 'owner',
      },
      {
        calendarId: 'team@example.com',
        summary: 'Team Calendar',
        primary: false,
        accessRole: 'writer',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listMyCalendarsExecute,
  agent: { toolsetSlug: 'gog-calendar.events' },
})
