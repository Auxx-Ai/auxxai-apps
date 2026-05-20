// src/tools/gcal-block-update-event.tool.server.ts

import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'

export default async function gcalBlockUpdateEvent(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeEvent('update', input)
}
