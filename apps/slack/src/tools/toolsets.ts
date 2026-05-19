// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Slack toolsets exposed to agents. Projected to runtime slugs as
 * `app:slack:<localId>`. See plans/kopilot/apps/slack-overhaul.md §5.
 *
 * v1 ships safe writes only — no destructive ops (`delete`, `archive`,
 * `create_channel`, `invite_to_channel`, `update_message`). Toolset
 * enablement is the approval gate; admins pick deliberately.
 *
 * `list_slack_channels` is intentionally toolset-less — it auto-attaches
 * when any `slack.*` toolset is enabled.
 */
export const slackToolsets: Toolset[] = [
  {
    id: 'slack.channels.read',
    name: 'Slack channels (read)',
    description: 'Find and inspect Slack channels in the connected workspace.',
    tools: ['find_slack_channel', 'get_slack_channel'],
  },
  {
    id: 'slack.users.read',
    name: 'Slack users (read)',
    description:
      'Look up Slack users by email or name. Resolves to Auxx contacts when the email matches.',
    tools: ['find_slack_user', 'get_slack_user'],
  },
  {
    id: 'slack.messages.read',
    name: 'Slack messages (read)',
    description: 'Search messages, read thread context, and pull recent channel history.',
    tools: ['search_slack_messages', 'get_slack_message_thread', 'get_recent_slack_messages'],
  },
  {
    id: 'slack.messages.write',
    name: 'Slack messages (write)',
    description: 'Post messages, reply in threads, and add reactions. No deletes or edits.',
    tools: ['send_slack_message', 'reply_in_slack_thread', 'add_slack_reaction'],
  },
]
