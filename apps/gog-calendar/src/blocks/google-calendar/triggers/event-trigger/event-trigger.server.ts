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
  const rawTriggerOn = input.triggerOn
  const triggerOn: string[] = Array.isArray(rawTriggerOn) ? rawTriggerOn : [rawTriggerOn as string]
  const matchTerm = input.matchTerm as string | undefined

  const now = new Date().toISOString()
  const lastChecked = (state.lastChecked as string) || now

  const updateBased = ['eventCreated', 'eventUpdated', 'eventCancelled'].filter((t) =>
    triggerOn.includes(t)
  )
  const timeBased = ['eventStarted', 'eventEnded'].filter((t) => triggerOn.includes(t))

  const seen = new Set<string>()
  const allEvents: Record<string, string>[] = []

  if (updateBased.length > 0) {
    const qs: Record<string, string | number | boolean> = {
      updatedMin: lastChecked,
      orderBy: 'updated',
      showDeleted: triggerOn.includes('eventCancelled'),
    }
    if (matchTerm) qs.q = matchTerm

    const rawEvents = await gcalApiRequestAll(
      token,
      'GET',
      `/calendar/v3/calendars/${calendarId}/events`,
      undefined,
      qs
    )

    for (const event of rawEvents) {
      if (
        triggerOn.includes('eventCancelled') &&
        event.status === 'cancelled' &&
        event.created !== event.updated
      ) {
        if (!seen.has(event.id)) {
          seen.add(event.id)
          allEvents.push(mapEvent(event, 'cancelled'))
        }
      }
      if (
        triggerOn.includes('eventCreated') &&
        event.created >= lastChecked &&
        event.created <= now
      ) {
        if (!seen.has(event.id)) {
          seen.add(event.id)
          allEvents.push(mapEvent(event, 'created'))
        }
      }
      if (
        triggerOn.includes('eventUpdated') &&
        event.created !== event.updated &&
        event.status !== 'cancelled'
      ) {
        if (!seen.has(event.id)) {
          seen.add(event.id)
          allEvents.push(mapEvent(event, 'updated'))
        }
      }
    }
  }

  if (timeBased.length > 0) {
    const qs: Record<string, string | number | boolean> = {
      singleEvents: true,
      timeMin: lastChecked,
      timeMax: now,
      orderBy: 'startTime',
    }
    if (matchTerm) qs.q = matchTerm

    const rawEvents = await gcalApiRequestAll(
      token,
      'GET',
      `/calendar/v3/calendars/${calendarId}/events`,
      undefined,
      qs
    )

    for (const event of rawEvents) {
      if (seen.has(event.id)) continue

      if (triggerOn.includes('eventStarted')) {
        const start = event.start?.dateTime || event.start?.date
        if (start >= lastChecked && start <= now) {
          seen.add(event.id)
          allEvents.push(mapEvent(event, 'started'))
          continue
        }
      }
      if (triggerOn.includes('eventEnded')) {
        const end = event.end?.dateTime || event.end?.date
        if (end >= lastChecked && end <= now) {
          seen.add(event.id)
          allEvents.push(mapEvent(event, 'ended'))
        }
      }
    }
  }

  return {
    events: allEvents,
    state: { ...state, lastChecked: now },
  }
}

function mapEvent(event: any, changeType: string): Record<string, string> {
  return {
    changeType,
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
  }
}
