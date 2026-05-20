// src/tools/gcal-block-create-event.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.create` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockCreateEventExecute from './gcal-block-create-event.tool.server'

export const gcalBlockCreateEventTool = defineTool({
  id: 'gcal_block_create_event',
  name: 'Google Calendar: create event (block)',
  description: 'Internal — backs the Google Calendar block event.create operation.',
  icon: googleCalendarIcon,
  inputs: z.object({
    eventCalendar: z.string(),
    createSummary: z.string(),
    createStart: z.string(),
    createEnd: z.string(),
    createAllDay: z.string().optional(),
    createDescription: z.string().optional(),
    createLocation: z.string().optional(),
    createAttendees: z.string().optional(),
    createColor: z.string().optional(),
    createVisibility: z.string().optional(),
    createShowMeAs: z.string().optional(),
    createGuestsCanModify: z.string().optional(),
    createGuestsCanInviteOthers: z.string().optional(),
    createGuestsCanSeeOtherGuests: z.string().optional(),
    createRecurrence: z.string().optional(),
    createConferenceSolution: z.string().optional(),
    createSendUpdates: z.string().optional(),
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
  config: { requiresConnection: true, timeout: 15000 },
  execute: gcalBlockCreateEventExecute,
})
