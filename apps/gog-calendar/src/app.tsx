// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { googleCalendarBlock } from './blocks/google-calendar/google-calendar.workflow'
import { eventTrigger } from './blocks/google-calendar/triggers/event-trigger/event-trigger.workflow'
import { checkAvailabilityTool } from './tools/check-availability.tool'
import { createCalendarEventTool } from './tools/create-event.tool'
import { deleteCalendarEventTool } from './tools/delete-event.tool'
import { getCalendarEventTool } from './tools/get-event.tool'
import { listMyCalendarsTool } from './tools/list-my-calendars.tool'
import { scanCalendarsTool } from './tools/scan-calendars.tool'
import { searchCalendarEventsTool } from './tools/search-events.tool'
import { calendarToolsets } from './tools/toolsets'
import { updateCalendarEventTool } from './tools/update-event.tool'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [googleCalendarBlock],
    triggers: [eventTrigger],
  },
  tools: [
    checkAvailabilityTool,
    scanCalendarsTool,
    listMyCalendarsTool,
    searchCalendarEventsTool,
    getCalendarEventTool,
    createCalendarEventTool,
    updateCalendarEventTool,
    deleteCalendarEventTool,
  ],
  toolsets: calendarToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align='center'>Google Calendar</TextBlock>
      <TextBlock align='left'>
        Manage Google Calendar events — create, update, delete, check availability, and trigger
        workflows based on calendar activity.
      </TextBlock>
    </>
  )
}
