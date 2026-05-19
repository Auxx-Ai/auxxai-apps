// src/tools/get-ms-teams-user.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import msTeamsIcon from '../assets/icon.png'
import getMsTeamsUserExecute from './get-ms-teams-user.tool.server'

export const getMsTeamsUserTool = defineTool({
  id: 'get_ms_teams_user',
  name: 'Get Microsoft Teams user',
  description:
    'Fetch a Graph user by id. Returns the Graph profile plus the Auxx contact recordId when the email matches a contact.',
  icon: msTeamsIcon,
  inputs: z.object({
    userId: z.string(),
  }),
  outputs: z.object({
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
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: getMsTeamsUserExecute,
  agent: { toolsetSlug: 'ms-teams.users.read' },
})
