// src/tools/gog-contacts-block-get-many-contacts.tool.tsx

/**
 * Internal-only tool — backs the Google Contacts block's `contact.getMany` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import gogContactsBlockGetManyContactsExecute from './gog-contacts-block-get-many-contacts.tool.server'

export const gogContactsBlockGetManyContactsTool = defineTool({
  id: 'gog_contacts_block_get_many_contacts',
  name: 'Google Contacts: get many contacts (block)',
  description: 'Internal — backs the Google Contacts block contact.getMany operation.',
  icon: googleContactsIcon,
  inputs: z.object({
    getManyUseQuery: z.string().optional(),
    getManyQuery: z.string().optional(),
    getManyFields: z.string().optional(),
    getManyLimit: z.union([z.string(), z.number()]).optional(),
    getManySortOrder: z.string().optional(),
  }),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: gogContactsBlockGetManyContactsExecute,
})
