// src/blocks/google-calendar/triggers/event-trigger/event-trigger.server.ts

import type { PollingState, PollingExecuteResult } from '@auxx/sdk/server'
import { gcalApiRequestAll } from '../../shared/google-calendar-api'

export default async function eventTriggerExecute(
  input: Record<string, unknown>,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const { state, connection } = polling
  if (!connection?.value) return { events: [], state }

  const token = connection.value
  const calendarId = encodeURIComponent(input.calendarId as string)
  const triggerOn = input.triggerOn as string
  const matchTerm = input.matchTerm as string | undefined

  const now = new Date().toISOString()
  const lastChecked = (state.lastChecked as string) || now

  const qs: Record<string, string | number | boolean> = { showDeleted: false }
  if (matchTerm) qs.q = matchTerm

  if (
    triggerOn === 'eventCreated' ||
    triggerOn === 'eventUpdated' ||
    triggerOn === 'eventCancelled'
  ) {
    qs.updatedMin = lastChecked
    qs.orderBy = 'updated'
    if (triggerOn === 'eventCancelled') qs.showDeleted = true
  } else if (triggerOn === 'eventStarted' || triggerOn === 'eventEnded') {
    qs.singleEvents = true
    qs.timeMin = lastChecked
    qs.timeMax = now
    qs.orderBy = 'startTime'
  }

  const rawEvents = await gcalApiRequestAll(
    token,
    'GET',
    `/calendar/v3/calendars/${calendarId}/events`,
    undefined,
    qs
  )

  let filtered = rawEvents
  if (triggerOn === 'eventCreated') {
    filtered = rawEvents.filter((e: any) => e.created >= lastChecked && e.created <= now)
  } else if (triggerOn === 'eventUpdated') {
    filtered = rawEvents.filter((e: any) => e.created !== e.updated)
  } else if (triggerOn === 'eventCancelled') {
    filtered = rawEvents.filter((e: any) => e.status === 'cancelled' && e.created !== e.updated)
  } else if (triggerOn === 'eventStarted') {
    filtered = rawEvents.filter((e: any) => {
      const start = e.start?.dateTime || e.start?.date
      return start >= lastChecked && start <= now
    })
  } else if (triggerOn === 'eventEnded') {
    filtered = rawEvents.filter((e: any) => {
      const end = e.end?.dateTime || e.end?.date
      return end >= lastChecked && end <= now
    })
  }

  const events = filtered.map((event: any) => ({
    eventId: event.id || '',
    summary: event.summary || '',
    description: event.description || '',
    location: event.location || '',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    status: event.status || '',
    htmlLink: event.htmlLink || '',
    attendees: JSON.stringify(event.attendees || []),
    organizer: event.organizer?.email || '',
    created: event.created || '',
    updated: event.updated || '',
  }))

  return {
    events,
    state: { ...state, lastChecked: now },
  }
}
