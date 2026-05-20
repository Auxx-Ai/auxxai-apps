// src/tools/gcal-block-get-event.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.get` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockGetEventExecute from './gcal-block-get-event.tool.server'

export const gcalBlockGetEventTool = defineTool({
  id: 'gcal_block_get_event',
  name: 'Google Calendar: get event (block)',
  description: 'Internal — backs the Google Calendar block event.get operation.',
  icon: googleCalendarIcon,
  inputs: z.object({
    eventCalendar: z.string(),
    getEventId: z.string(),
    getTimezone: z.string().optional(),
  }),
  outputs: z
    .object({
      eventId: z.string(),
      summary: z.string(),
      description: z.string(),
      location: z.string(),
      start: z.string(),
      end: z.string(),
      status: z.string(),
      htmlLink: z.string(),
      attendees: z.string(),
      organizer: z.string(),
      created: z.string(),
      updated: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: gcalBlockGetEventExecute,
})
