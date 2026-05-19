// src/tools/update-google-contact.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import updateGoogleContactExecute from './update-google-contact.tool.server'

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

export const updateGoogleContactTool = defineTool({
  id: 'update_google_contact',
  name: 'Update Google contact',
  description:
    'Patch fields on an existing Google contact. Use add*/remove* arrays for emails, phones, and groups — full-replace would risk dropping data the LLM did not echo back. Pass null to clear company/jobTitle/notes/birthday.',
  icon: googleContactsIcon,
  inputs: z.object({
    resourceName: z.string().describe('Google People resource name (e.g. people/c12345).'),
    etag: z
      .string()
      .optional()
      .describe(
        'Etag from a prior get_google_contact. Omit to have the server fetch the current etag (one extra API call).'
      ),
    patch: z
      .object({
        name: z
          .object({
            givenName: z.string().optional(),
            familyName: z.string().optional(),
            middleName: z.string().optional(),
            honorificPrefix: z.string().optional(),
            honorificSuffix: z.string().optional(),
          })
          .optional(),
        addEmails: z
          .array(z.object({ value: z.string().email(), type: EMAIL_TYPE.optional() }))
          .optional(),
        removeEmails: z
          .array(z.string().email())
          .optional()
          .describe('Email values to remove (exact match on value).'),
        addPhones: z.array(z.object({ value: z.string(), type: PHONE_TYPE.optional() })).optional(),
        removePhones: z.array(z.string()).optional(),
        company: z.string().nullable().optional().describe('Set string to update; null to clear.'),
        jobTitle: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        birthday: z.string().nullable().optional().describe('YYYY-MM-DD or null to clear.'),
        addGroupResourceNames: z.array(z.string()).optional(),
        removeGroupResourceNames: z.array(z.string()).optional(),
      })
      .describe('Fields to change. Only included fields are touched.'),
  }),
  outputs: z.object({
    auxxRecordId: refs.entity('contact').nullable(),
    resourceName: z.string(),
    contactId: z.string(),
    displayName: z.string().nullable(),
    etag: z.string().describe('Updated etag — use on the next update.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: updateGoogleContactExecute,
})
