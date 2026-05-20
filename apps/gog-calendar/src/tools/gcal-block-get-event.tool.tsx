// src/tools/gcal-block-get-event.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.get` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockGetEventExecute from './gcal-block-get-event.tool.server'
import { getEventInputs, getEventOutputs } from './schemas/event'

export const gcalBlockGetEventTool = defineTool({
  id: 'gcal_block_get_event',
  name: 'Google Calendar: get event (block)',
  description: 'Internal — backs the Google Calendar block event.get operation.',
  icon: googleCalendarIcon,
  inputs: getEventInputs,
  outputs: getEventOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: gcalBlockGetEventExecute,
})
