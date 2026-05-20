// src/tools/list-google-contact-groups.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import googleContactsIcon from '../assets/icon.png'
import listGoogleContactGroupsExecute from './list-google-contact-groups.tool.server'

export const listGoogleContactGroupsTool = defineTool({
  id: 'list_google_contact_groups',
  name: 'List Google contact groups',
  description:
    'List the contact groups (labels) on the connected Google account. Use this once before create_google_contact or update_google_contact when the caller wants to assign a group — the resourceName is required, not the human label.',
  icon: googleContactsIcon,
  inputs: z.object({}),
  outputs: z.object({
    groups: z
      .array(
        z.object({
          resourceName: z
            .string()
            .describe('Use in create/update as the group reference (e.g. contactGroups/abc).'),
          name: z.string().describe('Human-readable group name.'),
          groupType: z
            .enum(['USER_CONTACT_GROUP', 'SYSTEM_CONTACT_GROUP'])
            .describe('User-defined vs system (e.g. starred, myContacts).'),
          memberCount: z.number().int().nullable(),
        })
      )
      .describe('All accessible contact groups on the connected account.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listGoogleContactGroupsExecute,
  agent: {},
})
