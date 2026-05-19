// src/tools/find-google-contact.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import findGoogleContactExecute from './find-google-contact.tool.server'

export const findGoogleContactTool = defineTool({
  id: 'find_google_contact',
  name: 'Find Google contact',
  description:
    'Look up a Google contact by exact email or phone. Returns the contact plus the Auxx contact recordId when the contact has been imported into Auxx.',
  icon: googleContactsIcon,
  inputs: z
    .object({
      email: z
        .string()
        .email()
        .optional()
        .describe('Contact email. Provide email OR phone, not both.'),
      phone: z
        .string()
        .optional()
        .describe('Contact phone in E.164 (e.g. +14155551212). Provide email OR phone.'),
    })
    .refine((v) => (v.email ? 1 : 0) + (v.phone ? 1 : 0) === 1, {
      message: 'Provide exactly one of email or phone.',
    }),
  outputs: z.object({
    found: z.boolean(),
    contact: z
      .object({
        auxxRecordId: refs
          .entity('contact')
          .nullable()
          .describe(
            'Auxx contact record id, or null if not imported. Use in `auxx:entity-card` fences.'
          ),
        resourceName: z.string().describe('Google People API resource name (people/c12345).'),
        contactId: z.string().describe('Short id (the portion after people/).'),
        givenName: z.string().nullable(),
        familyName: z.string().nullable(),
        displayName: z.string().nullable(),
        emails: z.array(z.object({ value: z.string(), type: z.string().nullable() })),
        phones: z.array(z.object({ value: z.string(), type: z.string().nullable() })),
        company: z.string().nullable(),
        jobTitle: z.string().nullable(),
        notes: z.string().nullable(),
        birthday: z.string().nullable().describe('YYYY-MM-DD if set.'),
        groups: z.array(z.object({ resourceName: z.string(), name: z.string().nullable() })),
      })
      .nullable(),
    notImportedReason: z
      .enum(['NOT_IMPORTED'])
      .optional()
      .describe('Set when the Google contact exists but has no Auxx contact record.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: findGoogleContactExecute,
})
