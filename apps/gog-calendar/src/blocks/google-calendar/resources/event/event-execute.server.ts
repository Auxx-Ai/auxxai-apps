// src/blocks/google-calendar/resources/event/event-execute.server.ts

import { getOrganizationConnection } from '@auxx/sdk/server'
import { gcalApiRequest, throwConnectionNotFound } from '../../shared/google-calendar-api'

function mapEventResponse(event: any) {
  return {
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

export async function executeEvent(operation: string, input: any): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value
  const calendarId = encodeURIComponent(input.eventCalendar)

  switch (operation) {
    case 'create': {
      const body: any = {
        summary: input.createSummary,
      }

      if (input.createAllDay === 'yes') {
        body.start = { date: input.createStart?.split('T')[0] }
        body.end = { date: input.createEnd?.split('T')[0] }
      } else {
        body.start = { dateTime: input.createStart }
        body.end = { dateTime: input.createEnd }
      }

      if (input.createDescription) body.description = input.createDescription
      if (input.createLocation) body.location = input.createLocation
      if (input.createAttendees) {
        body.attendees = input.createAttendees.split(',').map((e: string) => ({ email: e.trim() }))
      }
      if (input.createColor) body.colorId = input.createColor
      if (input.createVisibility !== 'default') body.visibility = input.createVisibility
      if (input.createShowMeAs !== 'opaque') body.transparency = input.createShowMeAs
      if (input.createGuestsCanModify === 'true') body.guestsCanModify = true
      if (input.createGuestsCanInviteOthers === 'false') body.guestsCanInviteOthers = false
      if (input.createGuestsCanSeeOtherGuests === 'false') body.guestsCanSeeOtherGuests = false
      if (input.createRecurrence) body.recurrence = [`RRULE:${input.createRecurrence}`]
      if (input.createConferenceSolution) {
        body.conferenceData = {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolution: { type: input.createConferenceSolution },
          },
        }
      }

      const qs: any = {}
      if (input.createSendUpdates !== 'none') qs.sendUpdates = input.createSendUpdates
      if (input.createConferenceSolution) qs.conferenceDataVersion = 1

      const result = await gcalApiRequest(
        token,
        'POST',
        `/calendar/v3/calendars/${calendarId}/events`,
        body,
        qs
      )
      return mapEventResponse(result)
    }

    case 'delete': {
      const qs: any = {}
      if (input.deleteSendUpdates !== 'none') qs.sendUpdates = input.deleteSendUpdates

      await gcalApiRequest(
        token,
        'DELETE',
        `/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(input.deleteEventId)}`,
        undefined,
        qs
      )
      return { success: 'true' }
    }

    case 'get': {
      const qs: any = {}
      if (input.getTimezone) qs.timeZone = input.getTimezone

      const result = await gcalApiRequest(
        token,
        'GET',
        `/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(input.getEventId)}`,
        undefined,
        qs
      )
      return mapEventResponse(result)
    }

    case 'getMany': {
      const qs: any = {
        maxResults: Number(input.getManyLimit || 50),
      }
      if (input.getManyAfter) qs.timeMin = input.getManyAfter
      if (input.getManyBefore) qs.timeMax = input.getManyBefore
      if (input.getManyQuery) qs.q = input.getManyQuery
      if (input.getManyShowDeleted === 'true') qs.showDeleted = true
      if (input.getManyOrderBy) qs.orderBy = input.getManyOrderBy
      if (input.getManyExpandRecurring === 'true') qs.singleEvents = true
      if (input.getManyTimezone) qs.timeZone = input.getManyTimezone

      const result = await gcalApiRequest(
        token,
        'GET',
        `/calendar/v3/calendars/${calendarId}/events`,
        undefined,
        qs
      )
      const events = result.items || []
      return {
        events: JSON.stringify(events),
        count: String(events.length),
      }
    }

    case 'update': {
      const body: any = {}

      if (input.updateSummary) body.summary = input.updateSummary
      if (input.updateDescription) body.description = input.updateDescription
      if (input.updateLocation) body.location = input.updateLocation

      if (input.updateStart || input.updateEnd) {
        if (input.updateAllDay === 'yes') {
          if (input.updateStart) body.start = { date: input.updateStart.split('T')[0] }
          if (input.updateEnd) body.end = { date: input.updateEnd.split('T')[0] }
        } else {
          if (input.updateStart) body.start = { dateTime: input.updateStart }
          if (input.updateEnd) body.end = { dateTime: input.updateEnd }
        }
      }

      if (input.updateAttendees) {
        body.attendees = input.updateAttendees.split(',').map((e: string) => ({ email: e.trim() }))
      }
      if (input.updateColor) body.colorId = input.updateColor
      if (input.updateVisibility) body.visibility = input.updateVisibility
      if (input.updateShowMeAs) body.transparency = input.updateShowMeAs
      if (input.updateGuestsCanModify) body.guestsCanModify = input.updateGuestsCanModify === 'true'
      if (input.updateGuestsCanInviteOthers)
        body.guestsCanInviteOthers = input.updateGuestsCanInviteOthers === 'true'
      if (input.updateGuestsCanSeeOtherGuests)
        body.guestsCanSeeOtherGuests = input.updateGuestsCanSeeOtherGuests === 'true'
      if (input.updateRecurrence) body.recurrence = [`RRULE:${input.updateRecurrence}`]

      const qs: any = {}
      if (input.updateSendUpdates !== 'none') qs.sendUpdates = input.updateSendUpdates

      const result = await gcalApiRequest(
        token,
        'PATCH',
        `/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(input.updateEventId)}`,
        body,
        qs
      )
      return mapEventResponse(result)
    }

    default:
      throw new Error(`Unknown event operation: ${operation}`)
  }
}
