// src/tools/gcal-block-get-event.tool.server.ts

import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'

export default async function gcalBlockGetEvent(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeEvent('get', input)
}
