// src/tools/search-google-contacts.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import searchGoogleContactsExecute from './search-google-contacts.tool.server'

export const searchGoogleContactsTool = defineTool({
  id: 'search_google_contacts',
  name: 'Search Google contacts',
  description:
    'Free-text search across Google contacts (names, emails, phones, companies, notes). Returns summaries — use get_google_contact for full detail.',
  icon: googleContactsIcon,
  inputs: z.object({
    query: z
      .string()
      .min(1)
      .describe(
        'Free-text search across names, emails, phones, companies, notes. Google indexes prefixes — use specific terms.'
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Default 10. Hard max 50 (chat budget).'),
  }),
  outputs: z.object({
    contacts: z.array(
      z.object({
        auxxRecordId: refs.entity('contact').nullable(),
        resourceName: z.string(),
        contactId: z.string(),
        displayName: z.string().nullable(),
        emails: z.array(z.object({ value: z.string(), type: z.string().nullable() })),
        phones: z.array(z.object({ value: z.string(), type: z.string().nullable() })),
        company: z.string().nullable(),
        jobTitle: z.string().nullable(),
      })
    ),
    truncated: z.boolean().describe('True if more matches exist beyond the limit.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 15000,
  },
  execute: searchGoogleContactsExecute,
})
