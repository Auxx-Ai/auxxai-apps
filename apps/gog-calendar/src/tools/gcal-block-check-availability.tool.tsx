// src/tools/gcal-block-check-availability.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `calendar.checkAvailability`
 * op. No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockCheckAvailabilityExecute from './gcal-block-check-availability.tool.server'
import { checkAvailabilityInputs, checkAvailabilityOutputs } from './schemas/calendar'

export const gcalBlockCheckAvailabilityTool = defineTool({
  id: 'gcal_block_check_availability',
  name: 'Google Calendar: check availability (block)',
  description: 'Internal — backs the Google Calendar block calendar.checkAvailability operation.',
  icon: googleCalendarIcon,
  inputs: checkAvailabilityInputs,
  outputs: checkAvailabilityOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: gcalBlockCheckAvailabilityExecute,
})
