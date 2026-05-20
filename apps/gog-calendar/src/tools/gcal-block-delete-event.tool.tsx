// src/tools/gcal-block-delete-event.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.delete` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockDeleteEventExecute from './gcal-block-delete-event.tool.server'

export const gcalBlockDeleteEventTool = defineTool({
  id: 'gcal_block_delete_event',
  name: 'Google Calendar: delete event (block)',
  description: 'Internal — backs the Google Calendar block event.delete operation.',
  icon: googleCalendarIcon,
  inputs: z.object({
    eventCalendar: z.string(),
    deleteEventId: z.string(),
    deleteSendUpdates: z.string().optional(),
  }),
  outputs: z
    .object({
      success: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 10000 },
  execute: gcalBlockDeleteEventExecute,
})
