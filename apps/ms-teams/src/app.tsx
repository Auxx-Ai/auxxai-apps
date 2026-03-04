// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { msTeamsBlock } from './blocks/ms-teams/ms-teams.workflow'

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
    blocks: [msTeamsBlock],
    triggers: [],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">Microsoft Teams</TextBlock>
      <TextBlock align="left">
        Automate Microsoft Teams — manage channels, send messages to channels and chats, and create
        Planner tasks directly from your workflows.
      </TextBlock>
    </>
  )
}
