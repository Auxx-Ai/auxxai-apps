// src/tools/gcal-block-create-event.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.create` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockCreateEventExecute from './gcal-block-create-event.tool.server'
import { createEventInputs, createEventOutputs } from './schemas/event'

export const gcalBlockCreateEventTool = defineTool({
  id: 'gcal_block_create_event',
  name: 'Google Calendar: create event (block)',
  description: 'Internal — backs the Google Calendar block event.create operation.',
  icon: googleCalendarIcon,
  inputs: createEventInputs,
  outputs: createEventOutputs,
  config: { requiresConnection: true, timeout: 15000 },
  execute: gcalBlockCreateEventExecute,
})
