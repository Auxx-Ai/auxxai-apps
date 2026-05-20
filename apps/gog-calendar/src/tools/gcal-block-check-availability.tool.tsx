// src/tools/gcal-block-check-availability.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `calendar.checkAvailability`
 * op. No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockCheckAvailabilityExecute from './gcal-block-check-availability.tool.server'

export const gcalBlockCheckAvailabilityTool = defineTool({
  id: 'gcal_block_check_availability',
  name: 'Google Calendar: check availability (block)',
  description: 'Internal — backs the Google Calendar block calendar.checkAvailability operation.',
  icon: googleCalendarIcon,
  inputs: z.object({
    availabilityCalendar: z.string(),
    availabilityStartTime: z.string(),
    availabilityEndTime: z.string(),
    availabilityTimezone: z.string().optional(),
    availabilityOutputFormat: z.enum(['availability', 'bookedSlots', 'raw']).optional(),
  }),
  outputs: z
    .object({
      available: z.string(),
      bookedSlots: z.string(),
    })
    .passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: gcalBlockCheckAvailabilityExecute,
})
