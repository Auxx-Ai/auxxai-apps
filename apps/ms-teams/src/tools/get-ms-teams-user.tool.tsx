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
  exampleOutput: {
    id: '8b9f4c21-7d3e-4a1b-9f2c-1a2b3c4d5e6f',
    displayName: 'Jane Cooper',
    email: 'jane.cooper@contoso.com',
    userPrincipalName: 'jane.cooper@contoso.com',
    jobTitle: 'Product Marketing Manager',
    auxxRecordId: null,
    notImportedReason: null,
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: getMsTeamsUserExecute,
  agent: { toolsetSlug: 'ms-teams.users.read' },
})
