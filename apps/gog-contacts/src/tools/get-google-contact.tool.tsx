// src/tools/get-google-contact.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import getGoogleContactExecute from './get-google-contact.tool.server'

export const getGoogleContactTool = defineTool({
  id: 'get_google_contact',
  name: 'Get Google contact',
  description:
    'Fetch the full Google contact by resourceName. Includes addresses, URLs, and an etag for follow-up updates.',
  icon: googleContactsIcon,
  inputs: z.object({
    resourceName: z
      .string()
      .describe(
        'Google People API resource name (e.g. people/c12345). From find_google_contact or search_google_contacts.'
      ),
  }),
  outputs: z.object({
    auxxRecordId: refs
      .entity('contact')
      .nullable()
      .describe('Auxx contact record id, or null if not imported.'),
    resourceName: z.string(),
    contactId: z.string(),
    givenName: z.string().nullable(),
    familyName: z.string().nullable(),
    middleName: z.string().nullable(),
    honorificPrefix: z.string().nullable(),
    honorificSuffix: z.string().nullable(),
    displayName: z.string().nullable(),
    emails: z.array(z.object({ value: z.string(), type: z.string().nullable() })),
    phones: z.array(z.object({ value: z.string(), type: z.string().nullable() })),
    company: z.string().nullable(),
    jobTitle: z.string().nullable(),
    notes: z.string().nullable(),
    birthday: z.string().nullable(),
    groups: z.array(z.object({ resourceName: z.string(), name: z.string().nullable() })),
    addresses: z.array(
      z.object({
        type: z.string().nullable(),
        streetAddress: z.string().nullable(),
        city: z.string().nullable(),
        region: z.string().nullable(),
        postalCode: z.string().nullable(),
        countryCode: z.string().nullable(),
        formattedValue: z.string().nullable(),
      })
    ),
    urls: z.array(z.object({ value: z.string(), type: z.string().nullable() })),
    photoUrl: z.string().nullable(),
    etag: z
      .string()
      .describe('Pass this through to update_google_contact to avoid a stale-write conflict.'),
    notImportedReason: z.enum(['NOT_IMPORTED']).optional(),
  }),
  exampleOutput: {
    auxxRecordId: null,
    resourceName: 'people/c1234567890123456789',
    contactId: 'c1234567890123456789',
    givenName: 'Jane',
    familyName: 'Cooper',
    middleName: null,
    honorificPrefix: null,
    honorificSuffix: null,
    displayName: 'Jane Cooper',
    emails: [{ value: 'jane.cooper@example.com', type: 'work' }],
    phones: [{ value: '+14155551212', type: 'mobile' }],
    company: 'Acme Inc',
    jobTitle: 'Operations Lead',
    notes: 'Prefers email contact.',
    birthday: '1990-04-12',
    groups: [{ resourceName: 'contactGroups/myContacts', name: 'My Contacts' }],
    addresses: [
      {
        type: 'work',
        streetAddress: '548 Market St',
        city: 'San Francisco',
        region: 'CA',
        postalCode: '94104',
        countryCode: 'US',
        formattedValue: '548 Market St, San Francisco, CA 94104, US',
      },
    ],
    urls: [{ value: 'https://example.com', type: 'work' }],
    photoUrl: 'https://lh3.googleusercontent.com/contacts/photo123',
    etag: '%EgUBAj0DLhoEAQIFByIMSlc4cGRTbVZ4ZkU9',
  },
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: getGoogleContactExecute,
  agent: { toolsetSlug: 'gog-contacts.contacts.read' },
})
