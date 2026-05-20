// src/tools/gog-contacts-block-create-contact.tool.tsx

/**
 * Internal-only tool — backs the Google Contacts block's `contact.create` op.
 * Accepts the block-shaped flat input (createGivenName, createEmail, etc.) so
 * the dispatcher can pass inputs through without per-op projection.
 */

import { defineTool, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import gogContactsBlockCreateContactExecute from './gog-contacts-block-create-contact.tool.server'

export const gogContactsBlockCreateContactTool = defineTool({
  id: 'gog_contacts_block_create_contact',
  name: 'Google Contacts: create contact (block)',
  description: 'Internal — backs the Google Contacts block contact.create operation.',
  icon: googleContactsIcon,
  inputs: z.object({
    createGivenName: z.string().optional(),
    createFamilyName: z.string().optional(),
    createMiddleName: z.string().optional(),
    createHonorificPrefix: z.string().optional(),
    createHonorificSuffix: z.string().optional(),
    createEmail: z.string().optional(),
    createEmailType: z.string().optional(),
    createPhone: z.string().optional(),
    createPhoneType: z.string().optional(),
    createCompany: z.string().optional(),
    createJobTitle: z.string().optional(),
    createNotes: z.string().optional(),
    createBirthday: z.string().optional(),
    createStreetAddress: z.string().optional(),
    createCity: z.string().optional(),
    createRegion: z.string().optional(),
    createPostalCode: z.string().optional(),
    createCountryCode: z.string().optional(),
    createAddressType: z.string().optional(),
    createGroup: z.string().optional(),
  }),
  outputs: z.record(z.string(), z.unknown()),
  config: { requiresConnection: true, timeout: 15000 },
  execute: gogContactsBlockCreateContactExecute,
})
