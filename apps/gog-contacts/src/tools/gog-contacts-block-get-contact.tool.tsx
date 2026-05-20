// src/tools/gog-contacts-block-get-contact.tool.tsx

/**
 * Internal-only tool — backs the Google Contacts block's `contact.get` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import gogContactsBlockGetContactExecute from './gog-contacts-block-get-contact.tool.server'

export const gogContactsBlockGetContactTool = defineTool({
  id: 'gog_contacts_block_get_contact',
  name: 'Google Contacts: get contact (block)',
  description: 'Internal — backs the Google Contacts block contact.get operation.',
  icon: googleContactsIcon,
  inputs: z.object({
    getContactId: z.string(),
    getFields: z.string().optional(),
  }),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 10000 },
  execute: gogContactsBlockGetContactExecute,
})
