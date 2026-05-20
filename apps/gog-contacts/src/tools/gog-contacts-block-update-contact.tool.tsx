// src/tools/gog-contacts-block-update-contact.tool.tsx

/**
 * Internal-only tool — backs the Google Contacts block's `contact.update` op.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import gogContactsBlockUpdateContactExecute from './gog-contacts-block-update-contact.tool.server'

export const gogContactsBlockUpdateContactTool = defineTool({
  id: 'gog_contacts_block_update_contact',
  name: 'Google Contacts: update contact (block)',
  description: 'Internal — backs the Google Contacts block contact.update operation.',
  icon: googleContactsIcon,
  inputs: z.object({
    updateContactId: z.string(),
    updateGivenName: z.string().optional(),
    updateFamilyName: z.string().optional(),
    updateMiddleName: z.string().optional(),
    updateHonorificPrefix: z.string().optional(),
    updateHonorificSuffix: z.string().optional(),
    updateEmail: z.string().optional(),
    updateEmailType: z.string().optional(),
    updatePhone: z.string().optional(),
    updatePhoneType: z.string().optional(),
    updateCompany: z.string().optional(),
    updateJobTitle: z.string().optional(),
    updateNotes: z.string().optional(),
    updateBirthday: z.string().optional(),
    updateStreetAddress: z.string().optional(),
    updateCity: z.string().optional(),
    updateRegion: z.string().optional(),
    updatePostalCode: z.string().optional(),
    updateCountryCode: z.string().optional(),
    updateAddressType: z.string().optional(),
    updateGroup: z.string().optional(),
  }),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: gogContactsBlockUpdateContactExecute,
})
