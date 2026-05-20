// src/tools/gcal-block-delete-event.tool.tsx

/**
 * Internal-only tool — backs the Google Calendar block's `event.delete` op.
 * No `agent` / `action` surface keys: invoked solely via the block's
 * dispatcher through `ctx.runTool`.
 */

import { defineTool } from '@auxx/sdk/tools'
import googleCalendarIcon from '../assets/icon.png'
import gcalBlockDeleteEventExecute from './gcal-block-delete-event.tool.server'
import { deleteEventInputs, deleteEventOutputs } from './schemas/event'

export const gcalBlockDeleteEventTool = defineTool({
  id: 'gcal_block_delete_event',
  name: 'Google Calendar: delete event (block)',
  description: 'Internal — backs the Google Calendar block event.delete operation.',
  icon: googleCalendarIcon,
  inputs: deleteEventInputs,
  outputs: deleteEventOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: gcalBlockDeleteEventExecute,
})
