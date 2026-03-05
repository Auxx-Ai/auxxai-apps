// src/blocks/google-calendar/google-calendar.server.ts

import { VALID_OPERATIONS } from './resources/constants'
import { executeCalendar } from './resources/calendar/calendar-execute.server'
import { executeEvent } from './resources/event/event-execute.server'

export default async function googleCalendarExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'calendar':
      return executeCalendar(operation, input)
    case 'event':
      return executeEvent(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
