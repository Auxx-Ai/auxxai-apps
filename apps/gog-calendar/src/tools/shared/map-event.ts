// src/tools/shared/map-event.ts

/**
 * Tool-surface mapper for a Google Calendar event. Returns a structured shape
 * (typed attendees, nullable strings, parsed conferenceData) rather than the
 * workflow block's flat-stringified JSON.
 *
 * See plans/kopilot/apps/gog-calendar-overhaul.md §7.
 */
export interface MappedCalendarEvent {
  eventId: string
  calendarId: string
  summary: string
  description: string | null
  location: string | null
  start: string
  end: string
  allDay: boolean
  attendees: Array<{ email: string; responseStatus: string }>
  organizer: string | null
  status: string
  htmlLink: string
  recurrence: string[]
  conferenceData: { uri: string; name: string } | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEventForTool(event: any, calendarId: string): MappedCalendarEvent {
  return {
    eventId: event.id ?? '',
    calendarId,
    summary: event.summary ?? '',
    description: event.description ?? null,
    location: event.location ?? null,
    start: event.start?.dateTime ?? event.start?.date ?? '',
    end: event.end?.dateTime ?? event.end?.date ?? '',
    allDay: Boolean(event.start?.date),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendees: (event.attendees ?? []).map((a: any) => ({
      email: a.email,
      responseStatus: a.responseStatus ?? 'needsAction',
    })),
    organizer: event.organizer?.email ?? null,
    status: event.status ?? '',
    htmlLink: event.htmlLink ?? '',
    recurrence: event.recurrence ?? [],
    conferenceData: event.conferenceData?.entryPoints?.[0]
      ? {
          uri: event.conferenceData.entryPoints[0].uri,
          name: event.conferenceData.entryPoints[0].label ?? 'Meet',
        }
      : null,
  }
}

/**
 * Validate that an ISO 8601 timestamp carries an explicit offset (Z or
 * ±HH:MM). Tools reject offset-less inputs rather than silently using the
 * calendar default timezone. See plan §8 Q4.
 */
export function assertHasOffset(field: string, value: string): void {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    const err = new Error(
      `'${field}' must include an explicit UTC offset (e.g. ...Z or ...+02:00). Got: ${value}`
    ) as Error & { code: string }
    err.code = 'INVALID_TIMESTAMP'
    throw err
  }
}
