// src/tools/list-my-calendars.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  gcalApiRequestAll,
  throwConnectionNotFound,
} from '../blocks/google-calendar/shared/google-calendar-api'

interface CalendarRow {
  calendarId: string
  summary: string
  primary: boolean
  accessRole: string
}

interface ListMyCalendarsOutput {
  calendars: CalendarRow[]
}

export default async function listMyCalendars(): Promise<ListMyCalendarsOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()

  const items = await gcalApiRequestAll(
    connection.value,
    'GET',
    '/calendar/v3/users/me/calendarList'
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendars: CalendarRow[] = items.map((c: any) => ({
    calendarId: c.id ?? '',
    summary: c.summary ?? c.id ?? '',
    primary: Boolean(c.primary),
    accessRole: c.accessRole ?? '',
  }))

  return { calendars }
}
