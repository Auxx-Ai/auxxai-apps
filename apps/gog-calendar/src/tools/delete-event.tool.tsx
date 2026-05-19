// src/tools/delete-event.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import deleteEventExecute from './delete-event.tool.server'

export const deleteCalendarEventTool = defineTool({
  id: 'delete_calendar_event',
  name: 'Delete calendar event',
  description: 'Delete a Google Calendar event by id.',
  icon: googleCalendarIcon,
  inputs: z.object({
    calendarId: z.string(),
    eventId: z.string(),
    sendUpdates: z.enum(['none', 'all', 'externalOnly']).optional(),
  }),
  outputs: z.object({
    deleted: z.literal(true),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: deleteEventExecute,
})
