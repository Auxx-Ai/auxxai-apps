// src/tools/gcal-block-get-many-events.tool.server.ts

import { executeEvent } from '../blocks/google-calendar/resources/event/event-execute.server'

export default async function gcalBlockGetManyEvents(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeEvent('getMany', input)
}
