// src/tools/create-event.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  gcalApiRequest,
  throwConnectionNotFound,
} from '../blocks/google-calendar/shared/google-calendar-api'
import { assertHasOffset } from './shared/map-event'

interface CreateEventInput {
  calendarId: string
  summary: string
  start: string
  end: string
  allDay?: boolean
  description?: string
  location?: string
  attendees?: string[]
  conferencing?: 'none' | 'meet'
  sendUpdates?: 'none' | 'all' | 'externalOnly'
  recurrence?: string
}

interface CreateEventOutput {
  eventId: string
  calendarId: string
  htmlLink: string
  start: string
  end: string
  attendees: Array<{ email: string; responseStatus: string }>
  conferenceLink: string | null
}

export default async function createEvent(input: CreateEventInput): Promise<CreateEventOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  if (!input.allDay) {
    assertHasOffset('start', input.start)
    assertHasOffset('end', input.end)
  }

  const body: Record<string, unknown> = {
    summary: input.summary,
    start: input.allDay ? { date: input.start.slice(0, 10) } : { dateTime: input.start },
    end: input.allDay ? { date: input.end.slice(0, 10) } : { dateTime: input.end },
  }
  if (input.description) body.description = input.description
  if (input.location) body.location = input.location
  if (input.attendees?.length) {
    body.attendees = input.attendees.map((email) => ({ email }))
  }
  if (input.recurrence) {
    body.recurrence = [
      input.recurrence.startsWith('RRULE:') ? input.recurrence : `RRULE:${input.recurrence}`,
    ]
  }
  if (input.conferencing === 'meet') {
    body.conferenceData = {
      createRequest: {
        requestId: `auxx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  const qs: Record<string, string | number | boolean> = {}
  if (input.sendUpdates) qs.sendUpdates = input.sendUpdates
  if (input.conferencing === 'meet') qs.conferenceDataVersion = 1

  const event = await gcalApiRequest(
    token,
    'POST',
    `/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events`,
    body,
    Object.keys(qs).length ? qs : undefined
  )

  return {
    eventId: event.id ?? '',
    calendarId: input.calendarId,
    htmlLink: event.htmlLink ?? '',
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendees: (event.attendees ?? []).map((a: any) => ({
      email: a.email,
      responseStatus: a.responseStatus ?? 'needsAction',
    })),
    conferenceLink: event.conferenceData?.entryPoints?.[0]?.uri ?? null,
  }
}
