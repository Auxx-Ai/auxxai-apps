// src/tools/create-google-contact.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import createGoogleContactExecute from './create-google-contact.tool.server'

const EMAIL_TYPE = z.enum(['home', 'work', 'other'])
const PHONE_TYPE = z.enum([
  'mobile',
  'home',
  'work',
  'main',
  'homeFax',
  'workFax',
  'pager',
  'other',
])
const ADDRESS_TYPE = z.enum(['home', 'work', 'other'])

export const createGoogleContactTool = defineTool({
  id: 'create_google_contact',
  name: 'Create Google contact',
  description:
    'Create a new contact in the connected Google account. Use list_google_contact_groups first if assigning groups — the resourceName is required, not the human label.',
  icon: googleContactsIcon,
  inputs: z
    .object({
      name: z
        .object({
          givenName: z.string().optional(),
          familyName: z.string().optional(),
          middleName: z.string().optional(),
          honorificPrefix: z.string().optional(),
          honorificSuffix: z.string().optional(),
        })
        .describe('At least one of givenName / familyName / middleName must be provided.'),
      emails: z
        .array(
          z.object({
            value: z.string().email(),
            type: EMAIL_TYPE.optional().describe('Default home.'),
          })
        )
        .optional(),
      phones: z
        .array(
          z.object({
            value: z.string().describe('E.164 preferred.'),
            type: PHONE_TYPE.optional().describe('Default mobile.'),
          })
        )
        .optional(),
      company: z.string().optional(),
      jobTitle: z.string().optional(),
      notes: z.string().optional(),
      birthday: z.string().optional().describe('YYYY-MM-DD.'),
      addresses: z
        .array(
          z.object({
            type: ADDRESS_TYPE.optional(),
            streetAddress: z.string().optional(),
            city: z.string().optional(),
            region: z.string().optional(),
            postalCode: z.string().optional(),
            countryCode: z.string().optional().describe('ISO 3166-1 alpha-2.'),
          })
        )
        .optional(),
      groupResourceNames: z
        .array(z.string())
        .optional()
        .describe(
          'Group resource names (contactGroups/...) to add the contact to. Use list_google_contact_groups to discover.'
        ),
    })
    .refine((v) => Boolean(v.name.givenName || v.name.familyName || v.name.middleName), {
      message: 'name.givenName, name.familyName, or name.middleName is required.',
    }),
  outputs: z.object({
    auxxRecordId: refs
      .entity('contact')
      .nullable()
      .describe(
        'Auxx contact record id, or null until the integration importer picks the new contact up.'
      ),
    resourceName: z.string(),
    contactId: z.string(),
    displayName: z.string().nullable(),
    etag: z.string(),
    notImportedReason: z
      .enum(['NOT_IMPORTED'])
      .optional()
      .describe(
        'Set on create — the new Google contact has not been imported into Auxx yet. The poll trigger or next sync will pick it up.'
      ),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: createGoogleContactExecute,
})
