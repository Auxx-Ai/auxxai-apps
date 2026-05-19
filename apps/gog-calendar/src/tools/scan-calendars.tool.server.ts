// src/tools/scan-calendars.tool.server.ts

import { getConnection } from '@auxx/sdk/server'
import {
  gcalApiRequest,
  throwConnectionNotFound,
} from '../blocks/google-calendar/shared/google-calendar-api'

interface ScanCalendarsInput {
  calendarIds: string[]
  timeMin: string
  timeMax: string
  timeZone?: string
}

interface CalendarBusySummary {
  calendarId: string
  busyCount: number
  totalBusyMinutes: number
}

interface ScanCalendarsOutput {
  perCalendar: CalendarBusySummary[]
  /** Total busy intervals across every calendar scanned. */
  totalBusyIntervals: number
}

/**
 * Streaming tool — scans a list of Google Calendars one at a time, yielding
 * a progress event after each calendar so the chat UI can show per-calendar
 * status as the fan-out runs. Exists primarily to exercise the streaming
 * lambda path end-to-end (plans/kopilot/apps/README.md §6.2 / Wedge B).
 *
 * Returning `AsyncGenerator<ProgressEvent, ScanCalendarsOutput>` is the contract
 * the lambda's `executeAiToolStreaming` recognizes — yields are forwarded as
 * `event: progress` SSE frames; the generator's return value becomes the
 * terminal `event: result`.
 */
export default async function* scanCalendars(
  input: ScanCalendarsInput
): AsyncGenerator<{ kind: string; data: unknown }, ScanCalendarsOutput, void> {
  const connection = getConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  const calendarIds = input.calendarIds?.length ? input.calendarIds : ['primary']
  const perCalendar: CalendarBusySummary[] = []
  let totalBusyIntervals = 0

  yield {
    kind: 'phase',
    data: { phase: 'starting', total: calendarIds.length },
  }

  for (let i = 0; i < calendarIds.length; i++) {
    const calendarId = calendarIds[i]
    yield {
      kind: 'phase',
      data: { phase: 'scanning', calendarId, index: i + 1, total: calendarIds.length },
    }

    const body = {
      timeMin: new Date(input.timeMin).toISOString(),
      timeMax: new Date(input.timeMax).toISOString(),
      items: [{ id: calendarId }],
      ...(input.timeZone ? { timeZone: input.timeZone } : {}),
    }

    let busyCount = 0
    let totalBusyMinutes = 0
    try {
      const result = await gcalApiRequest(token, 'POST', '/calendar/v3/freeBusy', body)
      const slots = result.calendars?.[calendarId]?.busy ?? []
      busyCount = slots.length
      for (const slot of slots) {
        if (slot.start && slot.end) {
          const ms = new Date(slot.end).getTime() - new Date(slot.start).getTime()
          if (Number.isFinite(ms) && ms > 0) totalBusyMinutes += Math.round(ms / 60_000)
        }
      }
    } catch (err) {
      yield {
        kind: 'error',
        data: {
          calendarId,
          message: err instanceof Error ? err.message : String(err),
        },
      }
    }

    perCalendar.push({ calendarId, busyCount, totalBusyMinutes })
    totalBusyIntervals += busyCount

    yield {
      kind: 'partial',
      data: { calendarId, busyCount, totalBusyMinutes, completedCount: i + 1 },
    }
  }

  return { perCalendar, totalBusyIntervals }
}
