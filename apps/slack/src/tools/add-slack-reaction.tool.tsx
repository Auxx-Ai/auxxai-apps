// src/tools/add-slack-reaction.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import slackIcon from '../assets/icon.png'
import addSlackReactionExecute from './add-slack-reaction.tool.server'

export const addSlackReactionTool = defineTool({
  id: 'add_slack_reaction',
  name: 'Add Slack reaction',
  description:
    'Add an emoji reaction to a Slack message. Pass the shortcode without colons (e.g. "thumbsup", "white_check_mark").',
  icon: slackIcon,
  inputs: z.object({
    channelId: z.string(),
    ts: z.string(),
    emoji: z.string().describe('Emoji shortcode without colons, e.g. "thumbsup".'),
  }),
  outputs: z.object({
    ok: z.literal(true),
  }),
  config: { requiresConnection: true, timeout: 10000 },
  execute: addSlackReactionExecute,
  agent: { toolsetSlug: 'slack.messages.write' },
})
