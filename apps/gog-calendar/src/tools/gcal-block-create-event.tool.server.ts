// src/tools/gcal-block-create-event.tool.server.ts

import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'

export default async function gcalBlockCreateEvent(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeEvent('create', input)
}
