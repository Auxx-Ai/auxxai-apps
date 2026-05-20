// src/tools/schemas/event.ts

import { z } from '@auxx/sdk/tools'

// Shared output — create / get / update return the same event fields.
const eventOutputs = z
  .object({
    eventId: z.string(),
    summary: z.string(),
    description: z.string(),
    location: z.string(),
    start: z.string(),
    end: z.string(),
    status: z.string(),
    htmlLink: z.string(),
    attendees: z.string(),
    organizer: z.string(),
    created: z.string(),
    updated: z.string(),
  })
  .loose()

export const createEventInputs = z.object({
  eventCalendar: z.string(),
  createSummary: z.string(),
  createStart: z.string(),
  createEnd: z.string(),
  createAllDay: z.string().optional(),
  createDescription: z.string().optional(),
  createLocation: z.string().optional(),
  createAttendees: z.string().optional(),
  createColor: z.string().optional(),
  createVisibility: z.string().optional(),
  createShowMeAs: z.string().optional(),
  createGuestsCanModify: z.string().optional(),
  createGuestsCanInviteOthers: z.string().optional(),
  createGuestsCanSeeOtherGuests: z.string().optional(),
  createRecurrence: z.string().optional(),
  createConferenceSolution: z.string().optional(),
  createSendUpdates: z.string().optional(),
})
export const createEventOutputs = eventOutputs

export const deleteEventInputs = z.object({
  eventCalendar: z.string(),
  deleteEventId: z.string(),
  deleteSendUpdates: z.string().optional(),
})
export const deleteEventOutputs = z
  .object({
    success: z.string(),
  })
  .loose()

export const getEventInputs = z.object({
  eventCalendar: z.string(),
  getEventId: z.string(),
  getTimezone: z.string().optional(),
})
export const getEventOutputs = eventOutputs

export const getManyEventsInputs = z.object({
  eventCalendar: z.string(),
  getManyLimit: z.union([z.number(), z.string()]).optional(),
  getManyAfter: z.string().optional(),
  getManyBefore: z.string().optional(),
  getManyQuery: z.string().optional(),
  getManyShowDeleted: z.string().optional(),
  getManyOrderBy: z.string().optional(),
  getManyExpandRecurring: z.string().optional(),
  getManyTimezone: z.string().optional(),
})
export const getManyEventsOutputs = z
  .object({
    events: z.string(),
    count: z.string(),
  })
  .loose()

export const updateEventInputs = z.object({
  eventCalendar: z.string(),
  updateEventId: z.string(),
  updateSummary: z.string().optional(),
  updateDescription: z.string().optional(),
  updateLocation: z.string().optional(),
  updateStart: z.string().optional(),
  updateEnd: z.string().optional(),
  updateAllDay: z.string().optional(),
  updateAttendees: z.string().optional(),
  updateColor: z.string().optional(),
  updateVisibility: z.string().optional(),
  updateShowMeAs: z.string().optional(),
  updateGuestsCanModify: z.string().optional(),
  updateGuestsCanInviteOthers: z.string().optional(),
  updateGuestsCanSeeOtherGuests: z.string().optional(),
  updateRecurrence: z.string().optional(),
  updateSendUpdates: z.string().optional(),
})
export const updateEventOutputs = eventOutputs
