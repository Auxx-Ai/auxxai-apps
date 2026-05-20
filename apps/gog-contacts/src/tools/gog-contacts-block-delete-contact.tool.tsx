// src/tools/gog-contacts-block-delete-contact.tool.tsx

/**
 * Internal-only tool — backs the Google Contacts block's `contact.delete` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import gogContactsBlockDeleteContactExecute from './gog-contacts-block-delete-contact.tool.server'

export const gogContactsBlockDeleteContactTool = defineTool({
  id: 'gog_contacts_block_delete_contact',
  name: 'Google Contacts: delete contact (block)',
  description: 'Internal — backs the Google Contacts block contact.delete operation.',
  icon: googleContactsIcon,
  inputs: z.object({
    deleteContactId: z.string(),
  }),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: gogContactsBlockDeleteContactExecute,
})
