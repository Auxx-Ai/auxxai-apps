// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { googleContactsBlock } from './blocks/google-contacts/google-contacts.workflow'
import { contactTrigger } from './blocks/google-contacts/triggers/contact-trigger/contact-trigger.workflow'
import { createGoogleContactTool } from './tools/create-google-contact.tool'
import { findGoogleContactTool } from './tools/find-google-contact.tool'
import { getGoogleContactTool } from './tools/get-google-contact.tool'
import { gogContactsBlockCreateContactTool } from './tools/gog-contacts-block-create-contact.tool'
import { gogContactsBlockDeleteContactTool } from './tools/gog-contacts-block-delete-contact.tool'
import { gogContactsBlockGetContactTool } from './tools/gog-contacts-block-get-contact.tool'
import { gogContactsBlockGetManyContactsTool } from './tools/gog-contacts-block-get-many-contacts.tool'
import { gogContactsBlockUpdateContactTool } from './tools/gog-contacts-block-update-contact.tool'
import { listGoogleContactGroupsTool } from './tools/list-google-contact-groups.tool'
import { searchGoogleContactsTool } from './tools/search-google-contacts.tool'
import { gogContactsToolsets } from './tools/toolsets'
import { updateGoogleContactTool } from './tools/update-google-contact.tool'

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
  tools: [
    // Agent-facing tools (surfaced via `agent` keys + gogContactsToolsets).
    listGoogleContactGroupsTool,
    findGoogleContactTool,
    getGoogleContactTool,
    searchGoogleContactsTool,
    createGoogleContactTool,
    updateGoogleContactTool,
    // Internal tools — backing the `google-contacts` block dispatcher only.
    gogContactsBlockCreateContactTool,
    gogContactsBlockDeleteContactTool,
    gogContactsBlockGetContactTool,
    gogContactsBlockGetManyContactsTool,
    gogContactsBlockUpdateContactTool,
  ],
  toolsets: gogContactsToolsets,
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
