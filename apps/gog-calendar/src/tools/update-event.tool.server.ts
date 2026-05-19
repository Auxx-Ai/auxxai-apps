// src/tools/update-event.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  gcalApiRequest,
  throwConnectionNotFound,
} from '../blocks/google-calendar/shared/google-calendar-api'
import { assertHasOffset } from './shared/map-event'

interface UpdateEventInput {
  calendarId: string
  eventId: string
  patch: {
    summary?: string
    description?: string
    location?: string
    start?: string
    end?: string
    allDay?: boolean
    addAttendees?: string[]
    removeAttendees?: string[]
    recurrence?: string | null
  }
  sendUpdates?: 'none' | 'all' | 'externalOnly'
}

interface UpdateEventOutput {
  eventId: string
  htmlLink: string
  start: string
  end: string
  attendees: Array<{ email: string; responseStatus: string }>
}

export default async function updateEvent(input: UpdateEventInput): Promise<UpdateEventOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const { patch } = input

  // Read the current event so we can compute the merged attendees list. PATCH
  // semantics on Google Calendar replace nested arrays wholesale, so we have
  // to do the merge here.
  const needsAttendeeMerge =
    (patch.addAttendees?.length ?? 0) > 0 || (patch.removeAttendees?.length ?? 0) > 0

  const existing = needsAttendeeMerge
    ? await gcalApiRequest(
        token,
        'GET',
        `/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`
      )
    : null

  if (patch.start && !patch.allDay) assertHasOffset('patch.start', patch.start)
  if (patch.end && !patch.allDay) assertHasOffset('patch.end', patch.end)

  const body: Record<string, unknown> = {}
  if (patch.summary !== undefined) body.summary = patch.summary
  if (patch.description !== undefined) body.description = patch.description
  if (patch.location !== undefined) body.location = patch.location
  if (patch.start !== undefined) {
    body.start = patch.allDay ? { date: patch.start.slice(0, 10) } : { dateTime: patch.start }
  }
  if (patch.end !== undefined) {
    body.end = patch.allDay ? { date: patch.end.slice(0, 10) } : { dateTime: patch.end }
  }
  if (needsAttendeeMerge) {
    const removeSet = new Set((patch.removeAttendees ?? []).map((e) => e.toLowerCase()))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current: Array<{ email: string }> = existing?.attendees ?? []
    const kept = current.filter((a) => !removeSet.has(a.email?.toLowerCase?.() ?? ''))
    const keptEmails = new Set(kept.map((a) => a.email?.toLowerCase?.() ?? ''))
    const added = (patch.addAttendees ?? [])
      .filter((e) => !keptEmails.has(e.toLowerCase()))
      .map((email) => ({ email }))
    body.attendees = [...kept, ...added]
  }
  if (patch.recurrence === null) {
    body.recurrence = []
  } else if (patch.recurrence) {
    body.recurrence = [
      patch.recurrence.startsWith('RRULE:') ? patch.recurrence : `RRULE:${patch.recurrence}`,
    ]
  }

  const qs: Record<string, string | number | boolean> | undefined = input.sendUpdates
    ? { sendUpdates: input.sendUpdates }
    : undefined

  const event = await gcalApiRequest(
    token,
    'PATCH',
    `/calendar/v3/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`,
    body,
    qs
  )

  return {
    eventId: event.id ?? '',
    htmlLink: event.htmlLink ?? '',
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendees: (event.attendees ?? []).map((a: any) => ({
      email: a.email,
      responseStatus: a.responseStatus ?? 'needsAction',
    })),
  }
}
