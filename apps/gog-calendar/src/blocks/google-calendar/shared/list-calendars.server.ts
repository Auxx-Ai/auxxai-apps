// src/blocks/google-calendar/shared/list-calendars.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { gcalApiRequestAll, throwConnectionNotFound } from './google-calendar-api'

export default async function listCalendars(): Promise<{ value: string; label: string }[]> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()

  const calendars = await gcalApiRequestAll(
    connection.value,
    'GET',
    '/calendar/v3/users/me/calendarList'
  )

  return calendars
    .map((c: any) => ({ value: c.id, label: c.summary || c.id }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label))
}
