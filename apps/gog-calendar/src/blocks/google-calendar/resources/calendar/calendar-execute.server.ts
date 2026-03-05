// src/blocks/google-calendar/resources/calendar/calendar-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { gcalApiRequest, throwConnectionNotFound } from '../../shared/google-calendar-api'

export async function executeCalendar(operation: string, input: any): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'checkAvailability': {
      const calendarId = input.availabilityCalendar
      const body = {
        timeMin: new Date(input.availabilityStartTime).toISOString(),
        timeMax: new Date(input.availabilityEndTime).toISOString(),
        items: [{ id: calendarId }],
        ...(input.availabilityTimezone ? { timeZone: input.availabilityTimezone } : {}),
      }

      const result = await gcalApiRequest(token, 'POST', '/calendar/v3/freeBusy', body)

      const calendarData = result.calendars?.[calendarId]
      if (calendarData?.errors?.length) {
        throw new Error(calendarData.errors[0].reason || 'Calendar error')
      }

      const busySlots = calendarData?.busy || []

      if (input.availabilityOutputFormat === 'bookedSlots') {
        return {
          available: String(busySlots.length === 0),
          bookedSlots: JSON.stringify(busySlots),
        }
      }
      if (input.availabilityOutputFormat === 'raw') {
        return {
          available: String(busySlots.length === 0),
          bookedSlots: JSON.stringify(result),
        }
      }
      // default: availability
      return {
        available: String(busySlots.length === 0),
        bookedSlots: JSON.stringify(busySlots),
      }
    }

    default:
      throw new Error(`Unknown calendar operation: ${operation}`)
  }
}
