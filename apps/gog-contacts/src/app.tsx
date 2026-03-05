import { TextBlock } from '@auxx/sdk/client'
import { googleContactsBlock } from './blocks/google-contacts/google-contacts.workflow'
import { contactTrigger } from './blocks/google-contacts/triggers/contact-trigger/contact-trigger.workflow'

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
    blocks: [googleContactsBlock],
    triggers: [contactTrigger],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">Google Contacts</TextBlock>
      <TextBlock align="left">
        Manage Google Contacts — create, update, delete, and search contacts. Set up triggers to
        automatically start workflows when contacts are created, updated, or deleted.
      </TextBlock>
    </>
  )
}
