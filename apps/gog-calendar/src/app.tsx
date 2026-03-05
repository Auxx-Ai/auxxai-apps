// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { googleCalendarBlock } from './blocks/google-calendar/google-calendar.workflow'
import { eventTrigger } from './blocks/google-calendar/triggers/event-trigger/event-trigger.workflow'

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
}

export function App() {
  return (
    <>
      <TextBlock align="center">Google Calendar</TextBlock>
      <TextBlock align="left">
        Manage Google Calendar events — create, update, delete, check availability, and trigger
        workflows based on calendar activity.
      </TextBlock>
    </>
  )
}
