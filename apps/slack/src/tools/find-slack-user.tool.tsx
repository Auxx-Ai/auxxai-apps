// src/tools/find-slack-user.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import findSlackUserExecute from './find-slack-user.tool.server'

export const findSlackUserTool = defineTool({
  id: 'find_slack_user',
  name: 'Find Slack user',
  description:
    'Look up a Slack user by email (preferred) or display name. Returns the Slack profile plus the Auxx contact recordId when the email matches a contact.',
  icon: slackIcon,
  inputs: z.object({
    query: z
      .string()
      .describe('Email address or Slack display name. Email is preferred — name search is fuzzy.'),
  }),
  outputs: z.object({
    user: z
      .object({
        id: z.string(),
        name: z.string(),
        realName: z.string().nullable(),
        email: z.string().nullable(),
        isBot: z.boolean(),
        isDeleted: z.boolean(),
        auxxRecordId: refs
          .entity('contact')
          .nullable()
          .describe('Auxx contact record id, or null when no contact matches the email.'),
        notImportedReason: z
          .literal('NOT_IMPORTED')
          .nullable()
          .describe('Set when the Slack user has no email match in Auxx contacts.'),
      })
      .nullable(),
  }),
  exampleOutput: {
    user: {
      id: 'U0123ABCDEF',
      name: 'jane.cooper',
      realName: 'Jane Cooper',
      email: 'jane@example.com',
      isBot: false,
      isDeleted: false,
      auxxRecordId: null,
      notImportedReason: null,
    },
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: findSlackUserExecute,
  agent: { toolsetSlug: 'slack.users.read' },
})
