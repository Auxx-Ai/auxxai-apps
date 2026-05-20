// src/tools/gcal-block-check-availability.tool.server.ts

import { executeCalendar } from '../blocks/google-calendar/resources/calendar/calendar-execute.server'

export default async function gcalBlockCheckAvailability(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCalendar('checkAvailability', input)
}
