// src/tools/gcal-block-update-event.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.update` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockUpdateEventExecute from './gcal-block-update-event.tool.server'
import { updateEventInputs, updateEventOutputs } from './schemas/event'

export const gcalBlockUpdateEventTool = defineTool({
  id: 'gcal_block_update_event',
  name: 'Google Calendar: update event (block)',
  description: 'Internal — backs the Google Calendar block event.update operation.',
  icon: googleCalendarIcon,
  inputs: updateEventInputs,
  outputs: updateEventOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: gcalBlockUpdateEventExecute,
})
