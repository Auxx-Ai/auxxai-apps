// src/tools/get-slack-user.tool.tsx

import { defineTool, refs, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import getSlackUserExecute from './get-slack-user.tool.server'

export const getSlackUserTool = defineTool({
  id: 'get_slack_user',
  name: 'Get Slack user',
  description: 'Fetch a Slack user by id. Resolves the Auxx contact recordId via the user email.',
  icon: slackIcon,
  inputs: z.object({ userId: z.string() }),
  outputs: z.object({
    id: z.string(),
    name: z.string(),
    realName: z.string().nullable(),
    email: z.string().nullable(),
    isBot: z.boolean(),
    isDeleted: z.boolean(),
    auxxRecordId: refs.entity('contact').nullable(),
    notImportedReason: z.literal('NOT_IMPORTED').nullable(),
  }),
  exampleOutput: {
    id: 'U0123ABCDEF',
    name: 'jane.cooper',
    realName: 'Jane Cooper',
    email: 'jane@example.com',
    isBot: false,
    isDeleted: false,
    auxxRecordId: null,
    notImportedReason: null,
  },
  config: { requiresConnection: true, timeout: 10000 },
  execute: getSlackUserExecute,
  agent: { toolsetSlug: 'slack.users.read' },
})
