// src/tools/gcal-block-get-many-events.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.getMany` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockGetManyEventsExecute from './gcal-block-get-many-events.tool.server'
import { getManyEventsInputs, getManyEventsOutputs } from './schemas/event'

export const gcalBlockGetManyEventsTool = defineTool({
  id: 'gcal_block_get_many_events',
  name: 'Google Calendar: get many events (block)',
  description: 'Internal — backs the Google Calendar block event.getMany operation.',
  icon: googleCalendarIcon,
  inputs: getManyEventsInputs,
  outputs: getManyEventsOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: gcalBlockGetManyEventsExecute,
})
