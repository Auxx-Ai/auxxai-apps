// src/tools/gcal-block-get-many-events.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.getMany` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockGetManyEventsExecute from './gcal-block-get-many-events.tool.server'

export const gcalBlockGetManyEventsTool = defineTool({
  id: 'gcal_block_get_many_events',
  name: 'Google Calendar: get many events (block)',
  description: 'Internal — backs the Google Calendar block event.getMany operation.',
  icon: googleCalendarIcon,
  inputs: z.object({
    eventCalendar: z.string(),
    getManyLimit: z.union([z.number(), z.string()]).optional(),
    getManyAfter: z.string().optional(),
    getManyBefore: z.string().optional(),
    getManyQuery: z.string().optional(),
    getManyShowDeleted: z.string().optional(),
    getManyOrderBy: z.string().optional(),
    getManyExpandRecurring: z.string().optional(),
    getManyTimezone: z.string().optional(),
  }),
  outputs: z
    .object({
      events: z.string(),
      count: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: gcalBlockGetManyEventsExecute,
})
