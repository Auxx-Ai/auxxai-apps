// src/tools/gcal-block-delete-event.tool.server.ts

import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'

export default async function gcalBlockDeleteEvent(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeEvent('delete', input)
}
