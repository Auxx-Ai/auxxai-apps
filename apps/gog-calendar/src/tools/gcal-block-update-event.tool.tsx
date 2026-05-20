// src/tools/gcal-block-update-event.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.update` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockUpdateEventExecute from './gcal-block-update-event.tool.server'

export const gcalBlockUpdateEventTool = defineTool({
  id: 'gcal_block_update_event',
  name: 'Google Calendar: update event (block)',
  description: 'Internal — backs the Google Calendar block event.update operation.',
  icon: googleCalendarIcon,
  inputs: z.object({
    eventCalendar: z.string(),
    updateEventId: z.string(),
    updateSummary: z.string().optional(),
    updateDescription: z.string().optional(),
    updateLocation: z.string().optional(),
    updateStart: z.string().optional(),
    updateEnd: z.string().optional(),
    updateAllDay: z.string().optional(),
    updateAttendees: z.string().optional(),
    updateColor: z.string().optional(),
    updateVisibility: z.string().optional(),
    updateShowMeAs: z.string().optional(),
    updateGuestsCanModify: z.string().optional(),
    updateGuestsCanInviteOthers: z.string().optional(),
    updateGuestsCanSeeOtherGuests: z.string().optional(),
    updateRecurrence: z.string().optional(),
    updateSendUpdates: z.string().optional(),
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
  execute: gcalBlockUpdateEventExecute,
})
