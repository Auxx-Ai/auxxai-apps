// src/tools/find-ms-teams-user.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import findMsTeamsUserExecute from './find-ms-teams-user.tool.server'

export const findMsTeamsUserTool = defineTool({
  id: 'find_ms_teams_user',
  name: 'Find Microsoft Teams user',
  description:
    'Look up a Microsoft Graph user by email (preferred) or display name. Returns the Graph profile plus the Auxx contact recordId when the email matches a contact.',
  icon: msTeamsIcon,
  inputs: z.object({
    query: z
      .string()
      .describe('Email address or display name. Email is preferred — name search is fuzzy.'),
  }),
  outputs: z.object({
    user: z
      .object({
        id: z.string(),
        displayName: z.string(),
        email: z.string().nullable(),
        userPrincipalName: z.string().nullable(),
        jobTitle: z.string().nullable(),
        auxxRecordId: refs
          .entity('contact')
          .nullable()
          .describe('Auxx contact record id, or null when no contact matches the email.'),
        notImportedReason: z
          .literal('NOT_IMPORTED')
          .nullable()
          .describe('Set when the Teams user has no email match in Auxx contacts.'),
      })
      .nullable(),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: findMsTeamsUserExecute,
  agent: { toolsetSlug: 'ms-teams.users.read' },
})
