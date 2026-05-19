// src/tools/get-event.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  gcalApiRequest,
  throwConnectionNotFound,
} from '../blocks/google-calendar/shared/google-calendar-api'
import { type MappedCalendarEvent, mapEventForTool } from './shared/map-event'

interface GetEventInput {
  calendarId: string
  eventId: string
  timeZone?: string
}

type GetEventOutput = Omit<MappedCalendarEvent, 'calendarId'>

export default async function getEvent(input: GetEventInput): Promise<GetEventOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const qs = input.timeZone ? { timeZone: input.timeZone } : undefined
  const event = await gcalApiRequest(
    token,
    'GET',
    `/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    undefined,
    qs
  )

  const mapped = mapEventForTool(event, input.calendarId)
  // Drop calendarId from the response shape — it was already in the input.
  const { calendarId: _omit, ...rest } = mapped
  void _omit
  return rest
}
