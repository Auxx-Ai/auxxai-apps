// src/tools/search-events.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  gcalApiRequest,
  throwConnectionNotFound,
} from '../blocks/google-calendar/shared/google-calendar-api'

interface SearchEventsInput {
  calendarIds?: string[]
  q?: string
  timeMin: string
  timeMax: string
  limit?: number
  orderBy?: 'startTime' | 'updated'
}

interface EventRow {
  eventId: string
  calendarId: string
  summary: string
  start: string
  end: string
  location: string | null
  attendees: Array<{ email: string; responseStatus: string }>
  htmlLink: string
}

interface SearchEventsOutput {
  events: EventRow[]
  truncated: boolean
}

export default async function searchEvents(input: SearchEventsInput): Promise<SearchEventsOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const calendarIds = input.calendarIds?.length ? input.calendarIds : ['primary']
  const maxResults = input.limit ?? 25
  const orderBy = input.orderBy ?? 'startTime'

  const events: EventRow[] = []
  let truncated = false

  for (const calendarId of calendarIds) {
    const qs: Record<string, string | number | boolean> = {
      timeMin: new Date(input.timeMin).toISOString(),
      timeMax: new Date(input.timeMax).toISOString(),
      singleEvents: true,
      orderBy,
      maxResults,
    }
    if (input.q) qs.q = input.q

    const result = await gcalApiRequest(
      token,
      'GET',
      `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      undefined,
      qs
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = result.items ?? []
    if (result.nextPageToken) truncated = true

    for (const e of items) {
      events.push({
        eventId: e.id ?? '',
        calendarId,
        summary: e.summary ?? '',
        start: e.start?.dateTime ?? e.start?.date ?? '',
        end: e.end?.dateTime ?? e.end?.date ?? '',
        location: e.location ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendees: (e.attendees ?? []).map((a: any) => ({
          email: a.email,
          responseStatus: a.responseStatus ?? 'needsAction',
        })),
        htmlLink: e.htmlLink ?? '',
      })
    }
  }

  return { events, truncated }
}
