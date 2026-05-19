// src/tools/check-availability.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  gcalApiRequest,
  throwConnectionNotFound,
} from '../blocks/google-calendar/shared/google-calendar-api'

interface CheckAvailabilityInput {
  calendarIds?: string[]
  timeMin: string
  timeMax: string
  durationMinutes?: number
  timeZone?: string
}

interface TimeRange {
  start: string
  end: string
}

interface CheckAvailabilityOutput {
  busy: TimeRange[]
  suggestions: TimeRange[]
}

/**
 * Read-only Google Calendar availability check. Powers Kopilot turns like
 * "When am I free tomorrow?". The bridge resolves the cred from the agent's
 * `appAccounts['gog-calendar'].credId` (workspace or personal — doesn't
 * matter here). See plans/kopilot/apps/agent-credentials.md §3.5.
 */
export default async function checkAvailability(
  input: CheckAvailabilityInput
): Promise<CheckAvailabilityOutput> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const calendarIds = input.calendarIds?.length ? input.calendarIds : ['primary']
  const body = {
    timeMin: new Date(input.timeMin).toISOString(),
    timeMax: new Date(input.timeMax).toISOString(),
    items: calendarIds.map((id) => ({ id })),
    ...(input.timeZone ? { timeZone: input.timeZone } : {}),
  }

  const result = await gcalApiRequest(token, 'POST', '/calendar/v3/freeBusy', body)

  const busy: TimeRange[] = []
  for (const id of calendarIds) {
    const cal = result.calendars?.[id]
    if (cal?.busy && Array.isArray(cal.busy)) {
      for (const slot of cal.busy) {
        if (slot.start && slot.end) busy.push({ start: slot.start, end: slot.end })
      }
    }
  }
  busy.sort((a, b) => a.start.localeCompare(b.start))

  // Derive simple free-slot suggestions of the requested length.
  const duration = input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : 30
  const suggestions = deriveSuggestions(input.timeMin, input.timeMax, busy, duration)

  return { busy, suggestions }
}

function deriveSuggestions(
  windowStart: string,
  windowEnd: string,
  busy: TimeRange[],
  durationMinutes: number
): TimeRange[] {
  const durMs = durationMinutes * 60_000
  const startMs = new Date(windowStart).getTime()
  const endMs = new Date(windowEnd).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return []

  const merged: Array<[number, number]> = busy
    .map((b) => [new Date(b.start).getTime(), new Date(b.end).getTime()] as [number, number])
    .filter(([s, e]) => Number.isFinite(s) && Number.isFinite(e) && e > s)
    .sort((a, b) => a[0] - b[0])

  const out: TimeRange[] = []
  let cursor = startMs
  for (const [s, e] of merged) {
    if (s > cursor && s - cursor >= durMs) {
      out.push({
        start: new Date(cursor).toISOString(),
        end: new Date(cursor + durMs).toISOString(),
      })
    }
    cursor = Math.max(cursor, e)
    if (out.length >= 5) break
  }
  if (out.length < 5 && endMs - cursor >= durMs) {
    out.push({ start: new Date(cursor).toISOString(), end: new Date(cursor + durMs).toISOString() })
  }
  return out
}
