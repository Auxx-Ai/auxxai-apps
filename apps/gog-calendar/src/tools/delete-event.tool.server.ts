// src/tools/delete-event.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  gcalApiRequest,
  throwConnectionNotFound,
} from '../blocks/google-calendar/shared/google-calendar-api'

interface DeleteEventInput {
  calendarId: string
  eventId: string
  sendUpdates?: 'none' | 'all' | 'externalOnly'
}

export default async function deleteEvent(input: DeleteEventInput): Promise<{ deleted: true }> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const qs = input.sendUpdates ? { sendUpdates: input.sendUpdates } : undefined
  await gcalApiRequest(
    token,
    'DELETE',
    `/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    undefined,
    qs
  )

  return { deleted: true as const }
}
